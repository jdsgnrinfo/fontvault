const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, shell, nativeTheme } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs/promises');
const opentype = require('opentype.js');
const gdi = require('./gdi');
// Recolector de basura bajo demanda: tras el escaneo inicial quedaban ~50 MB de memoria ya sin usar
require('v8').setFlagsFromString('--expose-gc');
const collectGarbage = require('vm').runInNewContext('gc');
require('./icons');
const providers = require('./providers');
const APP_ICON = path.join(__dirname, 'build', 'icon.png');

const FONT_EXT = new Set(['.ttf', '.otf', '.ttc', '.woff', '.woff2']);
const STORE = path.join(app.getPath('userData'), 'library.json');
const active = new Set();

// Carpetas, favoritos y fuentes activas se guardan entre sesiones
const DEFAULT_SAMPLES = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789!@#$%^&()',
  'El veloz murciélago hindú comía feliz cardillo y kiwi.',
  'Jovencillo emponzoñado de whisky: ¡qué figurota exhibe!',
  'The quick brown fox jumps over the lazy dog.',
];
const DEFAULT_SETTINGS = { samples: DEFAULT_SAMPLES, size: 42, restoreActive: true, autoStart: false,
  hideToTray: false, scrollSpeed: 'normal', groupFamilies: true, theme: 'light', scrollSound: true, autoUpdate: true };
let store = { folders: [], favorites: [], active: [], iconFavorites: [], settings: { ...DEFAULT_SETTINGS } };
async function loadStore() {
  try { store = { ...store, ...JSON.parse(await fs.readFile(STORE, 'utf8')) }; } catch {}
  store.settings = { ...DEFAULT_SETTINGS, ...store.settings };
  // Versiones anteriores guardaban un único texto de ejemplo
  if (store.settings.sampleText) store.settings.samples = [store.settings.sampleText, ...DEFAULT_SAMPLES.slice(1)];
  delete store.settings.sampleText;
  // Antes solo existía Google Fonts: sus archivos pasan a la lista general de proveedores
  if (store.googleFiles) { store.providerFiles = { ...store.providerFiles, google: store.googleFiles }; delete store.googleFiles; }
}
// Los guardados van en cola y se escriben a un archivo temporal que luego se renombra: así dos guardados
// seguidos no se mezclan y un cierre a mitad nunca deja library.json (carpetas y ajustes) ni scan-cache.json corruptos
const writeQueues = new Map();
function writeAtomic(file, data) {
  const next = (writeQueues.get(file) ?? Promise.resolve()).then(async () => {
    await fs.writeFile(file + '.tmp', data);
    await fs.rename(file + '.tmp', file);
  }).catch(() => {});
  writeQueues.set(file, next);
  return next;
}
function saveStore() {
  store.active = [...active];
  return writeAtomic(STORE, JSON.stringify(store, null, 2));
}

async function walk(dir, out = []) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (FONT_EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

function readMeta(file, buf) {
  const ext = path.extname(file).toLowerCase();
  const fallback = { family: path.basename(file, ext), style: 'Regular' };
  // opentype.js no soporta .ttc ni .woff2: usamos el nombre de archivo
  if (ext === '.ttc' || ext === '.woff2') return fallback;
  try {
    const f = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), { lowMemory: true });
    // opentype.js 1.x agrupa los nombres por plataforma
    const n = f.names.windows || f.names.macintosh || f.names;
    const pick = (k) => k && (k.en || Object.values(k)[0]);
    return {
      family: pick(n.preferredFamily) || pick(n.fontFamily) || fallback.family,
      style: pick(n.preferredSubfamily) || pick(n.fontSubfamily) || 'Regular',
      designer: pick(n.designer) || pick(n.manufacturer) || '',
    };
  } catch { return fallback; }
}

// Caché de metadatos (familia, estilo, diseñador) por archivo, validada por fecha y tamaño:
// así solo se vuelven a leer y analizar las fuentes nuevas o modificadas
const SCAN_CACHE = path.join(app.getPath('userData'), 'scan-cache.json');
let scanCache = null;
async function loadScanCache() {
  if (scanCache) return scanCache;
  try { scanCache = JSON.parse(await fs.readFile(SCAN_CACHE, 'utf8')); } catch { scanCache = {}; }
  return scanCache;
}

async function scanFolder(folder) {
  const cache = await loadScanCache();
  const fonts = [];
  const files = await walk(folder);
  // Se olvidan las fuentes de esta carpeta que ya no existen, para que la caché no crezca para siempre
  const seen = new Set(files);
  let dirty = false;
  for (const f of Object.keys(cache)) if (f.startsWith(folder + path.sep) && !seen.has(f)) { delete cache[f]; dirty = true; }
  for (const file of files) {
    try {
      const st = await fs.stat(file);
      let meta = cache[file];
      if (!meta || meta.m !== st.mtimeMs || meta.s !== st.size) {
        const buf = await fs.readFile(file);
        meta = cache[file] = { m: st.mtimeMs, s: st.size, ...readMeta(file, buf) };
        dirty = true;
      }
      fonts.push({ file, folder, format: path.extname(file).slice(1).toUpperCase(), family: meta.family, style: meta.style, designer: meta.designer });
    } catch {}
  }
  if (dirty) await writeAtomic(SCAN_CACHE, JSON.stringify(cache));
  return fonts;
}

// Vigila las carpetas añadidas: al copiar, borrar o renombrar fuentes se vuelve a escanear esa carpeta
// y la interfaz se actualiza sin reiniciar la app
const watchers = new Map();
function watchFolder(folder) {
  if (watchers.has(folder)) return;
  let timer = null;
  try {
    const w = require('fs').watch(folder, { recursive: true }, () => {
      // Una copia de varias fuentes genera muchos avisos seguidos: esperamos a que se calme
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!store.folders.includes(folder)) return;
        win?.webContents.send('library:changed', { folder, fonts: await scanFolder(folder) });
      }, 800);
    });
    w.on('error', () => unwatchFolder(folder)); // p. ej. la carpeta se borró o el disco se desconectó
    watchers.set(folder, w);
  } catch {}
}
function unwatchFolder(folder) { watchers.get(folder)?.close(); watchers.delete(folder); }

ipcMain.handle('getLibrary', async () => {
  store.folders.forEach(watchFolder);
  const fonts = (await Promise.all(store.folders.map(scanFolder))).flat();
  setTimeout(collectGarbage, 1000);
  return { folders: store.folders, favorites: store.favorites, active: [...active], fonts, providerFiles: store.providerFiles ?? {} };
});

ipcMain.handle('addFolder', async () => {
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (r.canceled) return null;
  const folder = r.filePaths[0];
  if (!store.folders.includes(folder)) { store.folders.push(folder); await saveStore(); }
  watchFolder(folder);
  return { folder, fonts: await scanFolder(folder) };
});

ipcMain.handle('removeFolder', async (_e, folder) => {
  store.folders = store.folders.filter((f) => f !== folder);
  unwatchFolder(folder);
  for (const f of [...active]) if (f.startsWith(folder + path.sep)) { gdi.deactivate(f); active.delete(f); }
  await saveStore();
});

ipcMain.handle('readFont', async (_e, file) => {
  // "gf:Familia:estilo" (y "fsh:", "fso:") es una vista previa de un proveedor que se descarga al vuelo
  const remote = providers.parse(file);
  if (remote) return providers.readPreview(remote);
  const buf = await fs.readFile(file);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
});

const NAME_FIELDS = ['copyright', 'designer', 'designerURL', 'fontFamily', 'fontSubfamily', 'fullName', 'license', 'licenseURL',
  'manufacturer', 'manufacturerURL', 'postScriptName', 'uniqueID', 'version', 'description', 'trademark'];

// Caché de la información de las últimas fuentes consultadas (pestañas Glifos y Detalles)
const infoCache = new Map();
ipcMain.handle('fontInfo', async (_e, file) => {
  // En los proveedores descargamos (una vez) el archivo de ese estilo y lo analizamos como una fuente local
  const remote = providers.parse(file);
  if (remote) {
    try { file = await providers.styleFile(remote); } catch { return null; }
  }
  const st = await fs.stat(file).catch(() => null);
  const hit = infoCache.get(file);
  if (hit && st && hit.m === st.mtimeMs) { infoCache.delete(file); infoCache.set(file, hit); return hit.info; }
  const info = await readFontInfo(file);
  infoCache.set(file, { m: st?.mtimeMs, info });
  if (infoCache.size > 30) infoCache.delete(infoCache.keys().next().value);
  return info;
});

// Tabla de nombres y funciones OpenType (GSUB/GPOS) de un archivo
async function readFontInfo(file) {
  try {
    const buf = await fs.readFile(file);
    const f = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), { lowMemory: true });
    const n = f.names.windows || f.names.macintosh || f.names;
    const names = {};
    for (const k of NAME_FIELDS) {
      const v = n[k] && (n[k].en || Object.values(n[k])[0]);
      if (v) names[k] = String(v).trim();
    }
    const tags = new Set();
    for (const t of ['gsub', 'gpos']) for (const r of f.tables[t]?.features ?? []) tags.add(r.tag);
    // Caracteres que la fuente contiene realmente (sin controles ni espacios)
    const chars = Object.keys(f.tables.cmap?.glyphIndexMap ?? {}).map(Number)
      .filter((c) => c > 32 && !(c >= 0x7f && c <= 0xa0) && !(c >= 0xd800 && c <= 0xdfff) && c !== 0xad && c < 0xf0000)
      .sort((a, b) => a - b).slice(0, 4000);
    return { names, features: [...tags].sort(), glyphCount: f.numGlyphs, chars };
  } catch {
    return null;
  }
}

// Activa o desactiva una familia de un proveedor: la primera vez descarga sus archivos a la carpeta del proveedor
ipcMain.handle('providers:setActive', async (_e, id, family, on) => {
  const files = on ? await providers.download(id, family) : (store.providerFiles?.[id]?.[family] ?? []);
  store.providerFiles = { ...store.providerFiles, [id]: { ...store.providerFiles?.[id], [family]: files } };
  for (const file of files) {
    const ok = on ? gdi.activate(file) : gdi.deactivate(file);
    if (ok) on ? active.add(file) : active.delete(file);
  }
  await saveStore();
  return { active: [...active], providerFiles: store.providerFiles };
});

// Activa o desactiva archivos sueltos; devuelve los que quedaron activos
ipcMain.handle('setActive', async (_e, files, on) => {
  for (const file of files) {
    const ok = on ? gdi.activate(file) : gdi.deactivate(file);
    if (ok) on ? active.add(file) : active.delete(file);
  }
  await saveStore();
  return [...active];
});

ipcMain.handle('setFavorite', async (_e, family, on) => {
  store.favorites = store.favorites.filter((f) => f !== family);
  if (on) store.favorites.push(family);
  await saveStore();
  return store.favorites;
});

// Bibliotecas de iconos favoritas (prefijos de Iconify)
ipcMain.handle('iconFavorites', () => (Array.isArray(store.iconFavorites) ? store.iconFavorites : []));
ipcMain.handle('setIconFavorite', async (_e, prefix, on) => {
  const list = Array.isArray(store.iconFavorites) ? store.iconFavorites.filter((p) => p !== prefix) : [];
  if (on) list.push(prefix);
  store.iconFavorites = list;
  await saveStore();
  return list;
});

ipcMain.handle('getSettings', () => ({ ...store.settings, version: app.getVersion() }));

ipcMain.handle('setSettings', async (_e, patch) => {
  store.settings = { ...store.settings, ...patch };
  if ('autoStart' in patch) setLoginItem(patch.autoStart);
  if ('hideToTray' in patch) updateTray();
  if ('theme' in patch) win?.setBackgroundColor(patch.theme === 'dark' ? '#1a1a1a' : '#e9e9e6');
  await saveStore();
  return store.settings;
});

// Al iniciar con Windows la app arranca oculta en la bandeja
function setLoginItem(on) {
  // En desarrollo hay que pasar la ruta del proyecto para que Electron abra esta app
  const args = [...(app.isPackaged ? [] : [app.getAppPath()]), '--hidden'];
  app.setLoginItemSettings({ openAtLogin: !!on, path: process.execPath, args });
}
const startHidden = process.argv.includes('--hidden');

let win = null;
let tray = null;
let quitting = false;

function showWindow() { win.show(); win.focus(); }

// La bandeja sigue el tema de la barra de tareas de Windows (que puede ser distinto del de las apps):
// icono blanco sobre barra oscura y negro sobre barra clara
function trayIcon() {
  let light = false;
  try {
    const out = require('child_process').execFileSync('reg', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', '/v', 'SystemUsesLightTheme'], { encoding: 'utf8', windowsHide: true });
    light = /0x1\b/.test(out);
  } catch {} // sin la clave, Windows usa barra oscura
  return nativeImage.createFromPath(path.join(__dirname, 'build', light ? 'tray-black.png' : 'tray-white.png'));
}
nativeTheme.on('updated', () => tray?.setImage(trayIcon()));

function updateTray() {
  if (!store.settings.hideToTray && !startHidden) { tray?.destroy(); tray = null; return; }
  if (tray) return;
  tray = new Tray(trayIcon());
  tray.setToolTip('FontVault');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir FontVault', click: showWindow },
    { type: 'separator' },
    { label: 'Salir', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', showWindow);
}

// Una sola instancia: si se abre otra vez, mostramos la ventana existente (útil con la bandeja)
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => win && showWindow());

ipcMain.on('win:minimize', () => win.minimize());
ipcMain.on('win:toggleMaximize', () => (win.isMaximized() ? win.unmaximize() : win.maximize()));
ipcMain.on('win:close', () => win.close());
ipcMain.handle('win:isMaximized', () => win.isMaximized());
ipcMain.handle('win:getBounds', () => win.getBounds());
ipcMain.on('win:setBounds', (_e, b) => {
  const [minW, minH] = win.getMinimumSize();
  win.setBounds({ x: Math.round(b.x), y: Math.round(b.y), width: Math.max(minW, Math.round(b.width)), height: Math.max(minH, Math.round(b.height)) });
});

app.whenReady().then(async () => {
  await loadStore();
  if (store.settings.restoreActive) for (const f of store.active) if (gdi.activate(f)) active.add(f);

  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 560,
    backgroundColor: store.settings.theme === 'dark' ? '#1a1a1a' : '#e9e9e6',
    // Sin marco: dibujamos nuestros propios botones de ventana (como FontBase), así Windows no pinta
    // la línea oscura del marco en los bordes derecho e inferior
    frame: false,
    icon: APP_ICON,
    // Sin marco grueso desaparece la línea oscura de Windows; el redimensionado lo hacen los bordes de la propia página
    thickFrame: false,
    show: !startHidden,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), spellcheck: false },
  });
  win.loadFile('index.html');
  gdi.roundCorners(win.getNativeWindowHandle());

  // Al minimizar u ocultar en la bandeja, la interfaz suelta sus cachés y se vacía la caché HTTP
  const trim = () => { win.webContents.send('win:trim'); win.webContents.session.clearCache().catch(() => {}); collectGarbage(); };
  win.on('minimize', trim);
  win.on('hide', trim);

  const sendState = () => win.webContents.send('win:maximized', win.isMaximized());
  win.on('maximize', sendState);
  win.on('unmaximize', sendState);
  // Los enlaces externos (licencias, autores) se abren en el navegador
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });

  // Con "ocultar en la bandeja", cerrar la ventana solo la esconde
  win.on('close', (e) => {
    if (store.settings.hideToTray && !quitting) { e.preventDefault(); win.hide(); }
  });
  updateTray();
  // Las entradas de inicio antiguas no llevan --hidden
  if (store.settings.autoStart) setLoginItem(true);
  initUpdates();
});

// Actualizaciones desde las releases de GitHub. Con "automáticas" se descargan solas y se instalan al salir
let updateState = { status: 'idle' };
function sendUpdate(s) { updateState = s; win?.webContents.send('update:state', s); }
function checkUpdates() {
  if (!app.isPackaged) return sendUpdate({ status: 'error', message: 'solo disponible en la app instalada' });
  autoUpdater.checkForUpdates().catch(() => {}); // el error llega por el evento 'error'
}
function initUpdates() {
  autoUpdater.autoDownload = false;
  autoUpdater.on('checking-for-update', () => sendUpdate({ status: 'checking' }));
  autoUpdater.on('update-not-available', () => sendUpdate({ status: 'latest' }));
  autoUpdater.on('update-available', (i) => {
    sendUpdate({ status: 'available', version: i.version });
    if (store.settings.autoUpdate) autoUpdater.downloadUpdate().catch(() => {});
  });
  autoUpdater.on('download-progress', (p) => sendUpdate({ ...updateState, status: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', (i) => sendUpdate({ status: 'ready', version: i.version }));
  autoUpdater.on('error', (e) => sendUpdate({ status: 'error', message: String(e?.message || e).split('\n')[0] }));
  if (app.isPackaged && store.settings.autoUpdate) {
    setTimeout(checkUpdates, 5000);
    setInterval(() => store.settings.autoUpdate && checkUpdates(), 6 * 3600e3);
  }
}
ipcMain.handle('update:state', () => updateState);
ipcMain.on('update:check', checkUpdates);
ipcMain.on('update:download', () => autoUpdater.downloadUpdate().catch(() => {}));
ipcMain.on('update:install', () => { quitting = true; autoUpdater.quitAndInstall(true, true); });

// Las fuentes se liberan al cerrar y se reactivan en el siguiente arranque
app.on('before-quit', () => { quitting = true; for (const f of active) gdi.deactivate(f); });
app.on('window-all-closed', () => app.quit());
