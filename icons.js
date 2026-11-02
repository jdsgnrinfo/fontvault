// Bibliotecas de iconos a partir de la API pública de Iconify (https://iconify.design)
const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const API = 'https://api.iconify.design';
const DIR = path.join(app.getPath('userData'), 'icons');
const BATCH = 250; // nombres por petición, para no superar el largo máximo de la URL

let collections = null;

// Como mucho 4 peticiones a la vez; si Iconify limita (429), esperamos y reintentamos
let running = 0;
const queue = [];
async function limited(fn) {
  if (running >= 4) await new Promise((r) => queue.push(r));
  running++;
  try { return await fn(); } finally { running--; queue.shift()?.(); }
}

async function getJSON(url) {
  return limited(async () => {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url);
      if (res.status === 429 && attempt < 4) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
      if (!res.ok) throw new Error(`Iconify respondió ${res.status}`);
      return res.json();
    }
  });
}

// Caché en memoria de los datos SVG ya descargados, por colección
const cache = new Map();

ipcMain.handle('icons:data', async (_e, prefix, names) => {
  let set = cache.get(prefix);
  if (!set) cache.set(prefix, set = { width: 16, height: 16, icons: {} });
  // Como mucho 20 colecciones en memoria; se descarta la usada hace más tiempo
  cache.delete(prefix); cache.set(prefix, set);
  while (cache.size > 20) cache.delete(cache.keys().next().value);
  const missing = [...new Set(names)].filter((n) => !(n in set.icons));
  for (let i = 0; i < missing.length; i += BATCH) {
    const part = missing.slice(i, i + BATCH);
    const chunk = await getJSON(`${API}/${encodeURIComponent(prefix)}.json?icons=${part.map(encodeURIComponent).join(',')}`);
    if (chunk.width) set.width = chunk.width;
    if (chunk.height) set.height = chunk.height;
    Object.assign(set.icons, chunk.icons);
    // Los alias se resuelven al icono original
    for (const [alias, a] of Object.entries(chunk.aliases ?? {})) if (chunk.icons?.[a.parent]) set.icons[alias] = chunk.icons[a.parent];
    for (const n of part) if (!(n in set.icons)) set.icons[n] = null;
  }
  const icons = {};
  for (const n of names) if (set.icons[n]) icons[n] = set.icons[n];
  return { prefix, width: set.width, height: set.height, icons };
});

// Todos los nombres visibles de una colección (sin los ocultos)
function collectionNames(list) {
  const names = new Set(list.uncategorized ?? []);
  for (const icons of Object.values(list.categories ?? {})) for (const n of icons) names.add(n);
  return [...names];
}

ipcMain.handle('icons:collections', async () => {
  collections ??= await getJSON(`${API}/collections`);
  return collections;
});

ipcMain.handle('icons:collection', async (_e, prefix) => {
  const list = await getJSON(`${API}/collection?prefix=${encodeURIComponent(prefix)}`);
  return { prefix, title: list.title, total: list.total, categories: list.categories ?? {}, names: collectionNames(list) };
});

ipcMain.handle('icons:search', async (_e, query) => {
  const r = await getJSON(`${API}/search?query=${encodeURIComponent(query)}&limit=999`);
  return r.icons;
});

// Lo que el diccionario de la app no conoce se traduce con MyMemory (gratis y sin clave). Si falla, se busca solo el texto original
const translations = new Map();
ipcMain.handle('icons:translate', async (_e, query) => {
  const q = String(query).trim().toLowerCase().slice(0, 100);
  if (translations.has(q)) return translations.get(q);
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=es|en`, { signal: AbortSignal.timeout(4000) });
  const j = await res.json();
  // Al agotar la cuota diaria responde con un aviso en lugar de la traducción
  const text = Number(j.responseStatus) === 200 && !/MYMEMORY WARNING/i.test(j.responseData?.translatedText) ? j.responseData.translatedText : null;
  if (text) { translations.set(q, text); if (translations.size > 500) translations.delete(translations.keys().next().value); }
  return text;
});

// Descarga la colección completa y la guarda como JSON de Iconify para usarla sin conexión
ipcMain.handle('icons:download', async (e, prefix) => {
  collections ??= await getJSON(`${API}/collections`);
  const list = await getJSON(`${API}/collection?prefix=${encodeURIComponent(prefix)}`);
  const names = collectionNames(list);
  const data = { prefix, info: collections[prefix] ?? { name: list.title }, categories: list.categories ?? {}, icons: {}, width: 16, height: 16 };
  for (let i = 0; i < names.length; i += BATCH) {
    const chunk = await getJSON(`${API}/${prefix}.json?icons=${names.slice(i, i + BATCH).map(encodeURIComponent).join(',')}`);
    if (chunk.width) data.width = chunk.width;
    if (chunk.height) data.height = chunk.height;
    Object.assign(data.icons, chunk.icons);
    e.sender.send('icons:progress', prefix, Math.min(i + BATCH, names.length), names.length);
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${path.basename(prefix)}.json`), JSON.stringify(data));
  return Object.keys(data.icons).length;
});

ipcMain.handle('icons:libraries', async () => {
  let files = [];
  try { files = (await fs.readdir(DIR)).filter((f) => f.endsWith('.json')); } catch {}
  const libs = [];
  for (const f of files) {
    try {
      const d = JSON.parse(await fs.readFile(path.join(DIR, f), 'utf8'));
      libs.push({ prefix: d.prefix, info: d.info, count: Object.keys(d.icons).length });
    } catch {}
  }
  return libs.sort((a, b) => (a.info?.name ?? a.prefix).localeCompare(b.info?.name ?? b.prefix));
});

ipcMain.handle('icons:load', async (_e, prefix) =>
  JSON.parse(await fs.readFile(path.join(DIR, `${path.basename(prefix)}.json`), 'utf8')));

ipcMain.handle('icons:remove', (_e, prefix) => fs.rm(path.join(DIR, `${path.basename(prefix)}.json`), { force: true }));

ipcMain.handle('icons:saveSvg', async (_e, name, svg) => {
  const r = await dialog.showSaveDialog({ defaultPath: `${name}.svg`, filters: [{ name: 'SVG', extensions: ['svg'] }] });
  if (r.canceled || !r.filePath) return false;
  await fs.writeFile(r.filePath, svg);
  return true;
});

// Arrastre nativo: escribimos el SVG en un archivo temporal y lo arrastramos como archivo,
// así Figma, Illustrator, Affinity, Inkscape o el escritorio lo reciben como un SVG normal
const os = require('os');
const { nativeImage } = require('electron');
const DRAG_DIR = path.join(os.tmpdir(), 'fontvault-drag');

// Electron cancela el arrastre si el icono está vacío, así que lo preparamos al arrancar
let dragIcon = null;
app.whenReady().then(async () => {
  dragIcon = nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png')).resize({ width: 32, height: 32 });
});

ipcMain.on('icons:startDrag', (e, name, svg) => {
  const fsSync = require('fs');
  fsSync.mkdirSync(DRAG_DIR, { recursive: true });
  const file = path.join(DRAG_DIR, `${name.replace(/[^\w.-]+/g, '-')}.svg`);
  fsSync.writeFileSync(file, svg);
  const icon = dragIcon && !dragIcon.isEmpty() ? dragIcon : nativeImage.createFromBitmap(Buffer.alloc(32 * 32 * 4, 0x80), { width: 32, height: 32 });
  e.sender.startDrag({ file, icon });
});
