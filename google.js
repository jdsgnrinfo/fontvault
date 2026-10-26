// Proveedor Google Fonts: catálogo, vistas previas y activación (descarga los .ttf y los activa como las locales).
// Usa los mismos datos públicos que fonts.google.com (no requieren clave de API).
const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const DIR = path.join(app.getPath('userData'), 'providers', 'google');
const CATALOG = path.join(DIR, 'catalog.json');
const CATALOG_MAX_AGE = 7 * 24 * 3600 * 1000; // se actualiza una vez por semana

// Las respuestas de fonts.google.com empiezan con ")]}'" para evitar que se ejecuten como JS
const parseGoogle = (text) => JSON.parse(text.replace(/^\)\]\}'?\s*/, ''));

// Descarga que falla si el servidor responde con error, para no guardar una página de error como si fuera una fuente
async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Fonts respondió ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

let catalog = null;

async function loadCatalog() {
  if (catalog) return catalog;
  try {
    const st = await fs.stat(CATALOG);
    if (Date.now() - st.mtimeMs < CATALOG_MAX_AGE) return (catalog = JSON.parse(await fs.readFile(CATALOG, 'utf8')));
  } catch {}
  try {
    const meta = parseGoogle(await (await fetch('https://fonts.google.com/metadata/fonts')).text());
    catalog = meta.familyMetadataList.map((f) => ({
      family: f.family,
      category: f.category,
      designers: f.designers ?? [],
      popularity: f.popularity ?? 9999,
      styles: Object.keys(f.fonts ?? {}),
    }));
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(CATALOG, JSON.stringify(catalog));
  } catch {
    // Sin conexión: usamos la copia guardada aunque sea antigua
    try { catalog = JSON.parse(await fs.readFile(CATALOG, 'utf8')); } catch { catalog = []; }
  }
  return catalog;
}

ipcMain.handle('google:catalog', () => loadCatalog());

// Vista previa de un estilo (clave "Familia:400i"): pedimos el CSS de Google y descargamos el woff2 latino.
// Se guarda en memoria una pequeña caché para no repetir descargas al volver a la misma fuente
const previewCache = new Map();
exports.readPreview = async (key) => {
  if (previewCache.has(key)) return previewCache.get(key);
  const [family, style = '400'] = key.split(':');
  const italic = style.endsWith('i') ? 1 : 0;
  const weight = parseInt(style, 10) || 400;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@${italic},${weight}&display=block`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' },
  })).text();
  // El último bloque suele ser el subconjunto "latin"
  const urls = [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map((m) => m[1]);
  if (!urls.length) throw new Error('Sin vista previa');
  const buf = await fetchBuffer(urls[urls.length - 1]);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  previewCache.set(key, ab);
  if (previewCache.size > 40) previewCache.delete(previewCache.keys().next().value);
  return ab;
};

// Descarga los .ttf completos de una familia (prefiere los estáticos, que todas las apps de diseño entienden)
exports.download = async (family) => {
  const folder = path.join(DIR, family.replace(/[^\w -]+/g, '_'));
  try {
    const existing = (await fs.readdir(folder)).filter((f) => /\.(ttf|otf)$/i.test(f));
    if (existing.length) return existing.map((f) => path.join(folder, f));
  } catch {}
  const list = parseGoogle(await (await fetch(`https://fonts.google.com/download/list?family=${encodeURIComponent(family)}`)).text());
  const refs = list.manifest.fileRefs.filter((r) => /\.(ttf|otf)$/i.test(r.filename));
  const statics = refs.filter((r) => r.filename.startsWith('static/'));
  const chosen = statics.length ? statics : refs;
  // Se descarga en una carpeta temporal y solo se renombra al terminar: si se corta, no queda una familia a medias
  const tmp = folder + '.descargando';
  await fs.rm(tmp, { recursive: true, force: true });
  await fs.mkdir(tmp, { recursive: true });
  try {
    for (const r of chosen) await fs.writeFile(path.join(tmp, path.basename(r.filename)), await fetchBuffer(r.url));
    await fs.rm(folder, { recursive: true, force: true });
    await fs.rename(tmp, folder);
  } catch (err) {
    await fs.rm(tmp, { recursive: true, force: true });
    throw err;
  }
  return chosen.map((r) => path.join(folder, path.basename(r.filename)));
};

// Un solo .ttf de un estilo concreto ("Familia:700i"), para las pestañas Glifos y Detalles sin descargar la familia entera.
// Primero busca el estático con el nombre del estilo (Familia-BoldItalic.ttf); si no hay, usa el variable
const listCache = new Map();
const WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };

exports.styleFile = async (key) => {
  const [family, style = '400'] = key.split(':');
  const italic = style.endsWith('i');
  const w = WEIGHTS[parseInt(style, 10)] ?? 'Regular';
  const want = italic ? (w === 'Regular' ? 'Italic' : `${w}Italic`) : w;
  const folder = path.join(DIR, '_estilos', family.replace(/[^\w -]+/g, '_'));
  const cached = path.join(folder, `${want}.ttf`);
  try { await fs.access(cached); return cached; } catch {}

  let refs = listCache.get(family);
  if (!refs) {
    const list = parseGoogle(await (await fetch(`https://fonts.google.com/download/list?family=${encodeURIComponent(family)}`)).text());
    refs = list.manifest.fileRefs.filter((r) => /\.(ttf|otf)$/i.test(r.filename));
    listCache.set(family, refs);
  }
  const base = family.replace(/\s+/g, '');
  const pick =
    refs.find((r) => new RegExp(`(^|/)${base}-${want}\\.(ttf|otf)$`, 'i').test(r.filename)) ??
    refs.find((r) => !r.filename.startsWith('static/') && /italic/i.test(r.filename) === italic) ??
    refs.find((r) => !r.filename.startsWith('static/')) ??
    refs[0];
  if (!pick) throw new Error('Sin archivo');
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(cached, await fetchBuffer(pick.url));
  return cached;
};
