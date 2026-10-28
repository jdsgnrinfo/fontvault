// Proveedores de fuentes en línea: Google Fonts, Fontshare y Fontsource.
// Cada uno da su catálogo, vistas previas (woff2), la descarga de la familia para activarla
// y un solo archivo de un estilo para las pestañas Glifos y Detalles.
// Claves de estilo: "Familia:400" o "Familia:700i" (peso + i si es cursiva).
const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { splitKey, styleName, category } = require('./font-names');

const ROOT = path.join(app.getPath('userData'), 'providers');
const CATALOG_MAX_AGE = 7 * 24 * 3600 * 1000; // los catálogos se actualizan una vez por semana
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const safe = (name) => name.replace(/[^\w -]+/g, '_');

// Descarga que falla si el servidor responde con error, para no guardar una página de error como si fuera una fuente
async function fetchOk(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${new URL(url).host} respondió ${res.status}`);
  return res;
}
const fetchBuffer = async (url) => Buffer.from(await (await fetchOk(url)).arrayBuffer());
const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);


// Guarda en una carpeta temporal y solo la renombra al terminar: si algo falla, no queda una familia a medias
async function saveAtomically(folder, fill) {
  const tmp = folder + '.descargando';
  await fs.rm(tmp, { recursive: true, force: true });
  await fs.mkdir(tmp, { recursive: true });
  try {
    await fill(tmp);
    await fs.rm(folder, { recursive: true, force: true });
    await fs.rename(tmp, folder);
  } catch (err) {
    await fs.rm(tmp, { recursive: true, force: true });
    throw err;
  }
  return (await fs.readdir(folder)).filter((f) => /\.(ttf|otf)$/i.test(f)).map((f) => path.join(folder, f));
}

async function existing(folder) {
  try {
    const files = (await fs.readdir(folder)).filter((f) => /\.(ttf|otf)$/i.test(f));
    return files.length ? files.map((f) => path.join(folder, f)) : null;
  } catch { return null; }
}

// ---------- Google Fonts (mismos datos públicos que usa fonts.google.com) ----------
const parseGoogle = (text) => JSON.parse(text.replace(/^\)\]\}'?\s*/, ''));
const googleLists = new Map();
async function googleRefs(family) {
  if (!googleLists.has(family)) {
    const list = parseGoogle(await (await fetchOk(`https://fonts.google.com/download/list?family=${encodeURIComponent(family)}`)).text());
    googleLists.set(family, list.manifest.fileRefs.filter((r) => /\.(ttf|otf)$/i.test(r.filename)));
  }
  return googleLists.get(family);
}

const google = {
  async fetchCatalog() {
    const meta = parseGoogle(await (await fetchOk('https://fonts.google.com/metadata/fonts')).text());
    return meta.familyMetadataList.map((f) => ({
      family: f.family, category: category(f.category), designers: f.designers ?? [],
      popularity: f.popularity ?? 9999, styles: Object.keys(f.fonts ?? {}),
    }));
  },
  async previewUrl(key) {
    const { family, weight, italic } = splitKey(key);
    const css = await (await fetchOk(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@${italic ? 1 : 0},${weight}&display=block`, { headers: { 'User-Agent': UA } })).text();
    // El último bloque suele ser el subconjunto "latin"
    return [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map((m) => m[1]).pop();
  },
  async download(family, folder) {
    const refs = await googleRefs(family);
    const statics = refs.filter((r) => r.filename.startsWith('static/'));
    const chosen = statics.length ? statics : refs; // los estáticos los entienden todas las apps de diseño
    return saveAtomically(folder, async (tmp) => {
      for (const r of chosen) await fs.writeFile(path.join(tmp, path.basename(r.filename)), await fetchBuffer(r.url));
    });
  },
  async styleUrl(key) {
    const { family, weight, italic } = splitKey(key);
    const refs = await googleRefs(family);
    const want = styleName(weight, italic), base = family.replace(/\s+/g, '');
    const pick = refs.find((r) => new RegExp(`(^|/)${base}-${want}\\.(ttf|otf)$`, 'i').test(r.filename))
      ?? refs.find((r) => !r.filename.startsWith('static/') && /italic/i.test(r.filename) === italic)
      ?? refs.find((r) => !r.filename.startsWith('static/')) ?? refs[0];
    return pick?.url;
  },
};

// ---------- Fontshare (Indian Type Foundry, licencia gratuita para uso personal y comercial) ----------
const fontshare = {
  slugs: new Map(),
  async fetchCatalog() {
    const fonts = [];
    for (let page = 1; page < 20; page++) {
      const j = await (await fetchOk(`https://api.fontshare.com/v2/fonts?limit=100&page=${page}`)).json();
      fonts.push(...j.fonts);
      if (!j.has_more || !j.fonts.length) break;
    }
    // Popularidad según visitas: la más vista es la 1
    const byViews = [...fonts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    return fonts.map((f) => ({
      family: f.name, slug: f.slug, category: category(f.category), designers: (f.designers ?? []).map((d) => d.name),
      popularity: byViews.indexOf(f) + 1,
      styles: [...new Set((f.styles ?? []).filter((s) => !s.is_variable).map((s) => `${s.weight?.weight ?? 400}${s.is_italic ? 'i' : ''}`))],
    }));
  },
  async slug(family) {
    if (!this.slugs.size) for (const f of await loadCatalog('fontshare')) this.slugs.set(f.family, f.slug);
    return this.slugs.get(family) ?? family.toLowerCase().replace(/\s+/g, '-');
  },
  async previewUrl(key) {
    const { family, weight, italic } = splitKey(key);
    const css = await (await fetchOk(`https://api.fontshare.com/v2/css?f[]=${await this.slug(family)}@${weight}${italic ? 'i' : ''}&display=block`)).text();
    const url = css.match(/url\('([^']+\.woff2)'\)/)?.[1];
    return url && (url.startsWith('//') ? 'https:' + url : url);
  },
  // Fontshare entrega la familia en un ZIP; lo descomprime el tar de Windows (incluido desde Windows 10)
  // Todo se hace en una carpeta temporal (saveAtomically): si la descarga o la copia fallan, no queda a medias
  async extract(family) {
    const dir = path.join(ROOT, 'fontshare', '_zip', safe(family));
    if (await existing(dir)) return dir;
    const slug = await this.slug(family);
    await saveAtomically(dir, async (tmp) => {
      const zip = path.join(tmp, 'familia.zip');
      await fs.writeFile(zip, await fetchBuffer(`https://api.fontshare.com/v2/fonts/download/${slug}`));
      const tar = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
      await new Promise((ok, fail) => execFile(tar, ['-xf', zip, '-C', tmp], (err) => (err ? fail(err) : ok())));
      // Nos quedamos con los OTF estáticos (o TTF si no hay) en la raíz de la carpeta
      const all = [];
      const walk = async (d) => { for (const e of await fs.readdir(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) await walk(p); else all.push(p); } };
      await walk(tmp);
      const otf = all.filter((f) => /[\\/]OTF[\\/].+\.otf$/i.test(f));
      const ttf = all.filter((f) => /\.ttf$/i.test(f) && !/[\\/]WEB[\\/]/i.test(f) && !/variable/i.test(f));
      const chosen = otf.length ? otf : ttf;
      if (!chosen.length) throw new Error('El ZIP de Fontshare no trae fuentes');
      for (const f of chosen) await fs.copyFile(f, path.join(tmp, path.basename(f)));
      for (const e of await fs.readdir(tmp, { withFileTypes: true })) if (e.isDirectory() || e.name.endsWith('.zip')) await fs.rm(path.join(tmp, e.name), { recursive: true, force: true });
    });
    return dir;
  },
  async download(family, folder) {
    const src = await this.extract(family);
    return saveAtomically(folder, async (tmp) => { for (const f of await existing(src) ?? []) await fs.copyFile(f, path.join(tmp, path.basename(f))); });
  },
  async styleFile(key) {
    const { family, weight, italic } = splitKey(key);
    const files = (await existing(await this.extract(family))) ?? [];
    const want = styleName(weight, italic).toLowerCase();
    return files.find((f) => path.basename(f).toLowerCase().replace(/\.(otf|ttf)$/, '').endsWith('-' + want)) ?? files[0];
  },
};

// ---------- Fontsource (familias libres que no están en Google Fonts) ----------
const fontsourceInfo = new Map();
async function fontsourceVariants(family) {
  const entry = (await loadCatalog('fontsource')).find((f) => f.family === family);
  if (!entry) throw new Error('Familia desconocida');
  if (!fontsourceInfo.has(entry.id)) fontsourceInfo.set(entry.id, await (await fetchOk(`https://api.fontsource.org/v1/fonts/${entry.id}`)).json());
  return fontsourceInfo.get(entry.id);
}
// shortcut: Fontsource solo publica archivos divididos por alfabeto; usamos el "latin", que cubre español e inglés
const fontsourceUrl = (info, weight, italic, format) => {
  const v = info.variants?.[weight]?.[italic ? 'italic' : 'normal'];
  const sub = v?.[info.defSubset] ?? v?.latin ?? (v && Object.values(v)[0]);
  return sub?.url?.[format];
};

const fontsource = {
  async fetchCatalog() {
    const list = await (await fetchOk('https://api.fontsource.org/v1/fonts?type=other')).json();
    return list.map((f) => ({
      family: f.family, id: f.id, category: category(f.category), designers: [], popularity: 9999,
      styles: f.weights.flatMap((w) => f.styles.map((s) => `${w}${s === 'italic' ? 'i' : ''}`)),
    }));
  },
  async previewUrl(key) {
    const { family, weight, italic } = splitKey(key);
    return fontsourceUrl(await fontsourceVariants(family), weight, italic, 'woff2');
  },
  async download(family, folder) {
    const info = await fontsourceVariants(family);
    return saveAtomically(folder, async (tmp) => {
      for (const w of info.weights) for (const s of info.styles) {
        const url = fontsourceUrl(info, w, s === 'italic', 'ttf');
        if (url) await fs.writeFile(path.join(tmp, `${safe(family).replace(/\s+/g, '')}-${styleName(w, s === 'italic')}.ttf`), await fetchBuffer(url));
      }
    });
  },
  async styleUrl(key) {
    const { family, weight, italic } = splitKey(key);
    return fontsourceUrl(await fontsourceVariants(family), weight, italic, 'ttf');
  },
};

const PROVIDERS = { google, fontshare, fontsource };
// Prefijo de las claves de archivo en la interfaz: "gf:Roboto:400", "fsh:Satoshi:700", "fso:Bagnard:400"
const PREFIX = { gf: 'google', fsh: 'fontshare', fso: 'fontsource' };

const catalogs = {};
async function loadCatalog(id) {
  if (catalogs[id]) return catalogs[id];
  const file = path.join(ROOT, id, 'catalog.json');
  try {
    if (Date.now() - (await fs.stat(file)).mtimeMs < CATALOG_MAX_AGE) return (catalogs[id] = JSON.parse(await fs.readFile(file, 'utf8')));
  } catch {}
  try {
    catalogs[id] = await PROVIDERS[id].fetchCatalog();
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(catalogs[id]));
  } catch {
    // Sin conexión: usamos la copia guardada aunque sea antigua
    try { catalogs[id] = JSON.parse(await fs.readFile(file, 'utf8')); } catch { catalogs[id] = []; }
  }
  return catalogs[id];
}

ipcMain.handle('providers:catalog', (_e, id) => (PROVIDERS[id] ? loadCatalog(id) : []));

// "gf:Roboto:400" → proveedor y clave de estilo; null si no es de un proveedor
exports.parse = (file) => {
  const i = file.indexOf(':');
  const id = PREFIX[file.slice(0, i)];
  return id ? { id, key: file.slice(i + 1) } : null;
};

const previewCache = new Map();
exports.readPreview = async ({ id, key }) => {
  const cacheKey = id + ':' + key;
  if (previewCache.has(cacheKey)) return previewCache.get(cacheKey);
  const url = await PROVIDERS[id].previewUrl(key);
  if (!url) throw new Error('Sin vista previa');
  const ab = toArrayBuffer(await fetchBuffer(url));
  previewCache.set(cacheKey, ab);
  if (previewCache.size > 40) previewCache.delete(previewCache.keys().next().value);
  return ab;
};

// Descarga (una vez) la familia completa para activarla
exports.download = async (id, family) => {
  const folder = path.join(ROOT, id, safe(family));
  return (await existing(folder)) ?? PROVIDERS[id].download(family, folder);
};

// Un solo archivo de un estilo para Glifos y Detalles, sin descargar la familia entera
exports.styleFile = async ({ id, key }) => {
  const p = PROVIDERS[id];
  if (p.styleFile) return p.styleFile(key);
  const { family, weight, italic } = splitKey(key);
  const cached = path.join(ROOT, id, '_estilos', safe(family), `${styleName(weight, italic)}.ttf`);
  try { await fs.access(cached); return cached; } catch {}
  const url = await p.styleUrl(key);
  if (!url) throw new Error('Sin archivo');
  await fs.mkdir(path.dirname(cached), { recursive: true });
  await fs.writeFile(cached, await fetchBuffer(url));
  return cached;
};

