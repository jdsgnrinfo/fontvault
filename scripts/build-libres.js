// Genera libres.json: el catálogo de fundiciones libres publicadas en GitHub.
// Uso: node scripts/build-libres.js (necesita gh con sesión iniciada). Solo lee las fuentes, no ejecuta nada de lo descargado.
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const opentype = require('opentype.js');
const { category } = require('../font-names');

const ORGS = ['collletttivo', 'velvetyne', 'theleagueof', 'Omnibus-Type'];
const LICENSES = { 'OFL-1.1': 'OFL', MIT: 'MIT', 'Apache-2.0': 'Apache-2.0' };
const SKIP_DIR = /(^|\/)(old|archive|archives|previous|tests?|versions?|sources?|web|webfonts?|woff2?)\//i;

// Repositorios donde GitHub no reconoce la licencia y se leyó a mano (todas OFL 1.1). Uno nuevo queda como "texto" y falla la prueba
const REVIEWED = new Set(['Omnibus-Type/ArchivoBlack', 'Omnibus-Type/Barrio', 'Omnibus-Type/Leluja', 'Omnibus-Type/PragatiNarrow',
  'velvetyne/resistance-generale', 'velvetyne/Sporting-Grotesque',
  ...['blackout', 'chunk', 'fanwood', 'goudy-bookletter-1911', 'junction', 'knewave', 'league-script-number-one', 'linden-hill', 'orbitron', 'ostrich-sans', 'prociono', 'sniglet', 'sorts-mill-goudy'].map((n) => 'theleagueof/' + n)]);

// El nombre no siempre dice el tipo de letra: estas se clasifican a mano; el resto usa la regla general
const CATEGORIES = [
  [/^(Faustina|Fanwood|Goudy Bookletter|Labrada|Linden Hill|Manuale|Sorts Mill Goudy|Prociono|Texturina|Coconat|Grenze$|Ortica|ChunkFive)/, 'Serif'],
  [/^(Ronzino|Absans|Apfel Grotezk|Archivo|Accessiway|Asap|Chivo$|Rosario|Saira|Jaldi|Pragati|League Spartan|Ostrich|Junction|Sporting Grotesque|Orbitron|Mattone|Truculenta|Sansita$)/, 'Sans Serif'],
  [/^(Knewave)/, 'Handwriting'],
];
const categoryOf = (family) => CATEGORIES.find(([re]) => re.test(family))?.[1] ?? category(family);

const gh = (url) => JSON.parse(execFileSync('gh', ['api', url], { encoding: 'utf8', maxBuffer: 1e8 }));
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); } return out; };

// Sin licencia que GitHub reconozca, se acepta solo si su archivo de licencia lo dice expresamente
function license(spdx, files) {
  if (LICENSES[spdx]) return { license: LICENSES[spdx], licenseFrom: 'github' };
  const text = files.filter((f) => /licen|ofl/i.test(path.basename(f)) && !/\.(otf|ttf)$/i.test(f) && fs.statSync(f).size < 200000)
    .map((f) => fs.readFileSync(f, 'latin1')).join(' ');
  if (/non-?commercial/i.test(text)) return null;
  const found = /Open Font License/i.test(text) ? 'OFL' : /MIT License/i.test(text) ? 'MIT' : /Apache License/i.test(text) ? 'Apache-2.0' : null;
  return found && { license: found, licenseFrom: 'texto' };
}

function describe(file) {
  const buf = fs.readFileSync(file);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), { lowMemory: true });
  const n = font.names, get = (k) => n.windows?.[k]?.en ?? n.macintosh?.[k]?.en ?? n[k]?.en;
  return {
    family: (get('preferredFamily') ?? get('fontFamily') ?? '').replace(/^OFL\s+/, '').trim(),
    designer: (get('designer') ?? '').trim(),
    subfamily: (get('preferredSubfamily') ?? get('fontSubfamily') ?? '').trim(),
    weight: font.tables.os2?.usWeightClass || 400,
    italic: !!(font.tables.os2?.fsSelection & 1),
  };
}

async function repo(org, r, root, out) {
  const dir = path.join(root, org, r.name);
  fs.mkdirSync(dir, { recursive: true });
  const sha = gh(`repos/${org}/${r.name}/commits/${r.default_branch}`).sha;
  const res = await fetch(`https://codeload.github.com/${org}/${r.name}/tar.gz/${sha}`);
  if (!res.ok) throw new Error(`${r.name}: ${res.status}`);
  const tgz = path.join(root, `${org}-${r.name}.tgz`);
  fs.writeFileSync(tgz, Buffer.from(await res.arrayBuffer()));
  try { execFileSync('tar', ['-xzf', path.basename(tgz), '-C', path.relative(root, dir).replace(/\\/g, '/'), '--strip-components=1', '--wildcards', '--ignore-case', '*.otf', '*.ttf', '*licen*', '*ofl*'], { cwd: root, stdio: 'ignore' }); } catch {}
  fs.unlinkSync(tgz);

  const files = walk(dir);
  const lic = license(r.license?.spdx_id, files);
  if (lic?.licenseFrom === 'texto' && REVIEWED.has(`${org}/${r.name}`)) lic.licenseFrom = 'revisada';
  const rel = (f) => path.relative(dir, f).replace(/\\/g, '/');
  let fonts = files.filter((f) => /\.(otf|ttf)$/i.test(f) && !path.basename(f).startsWith('._') && !SKIP_DIR.test(rel(f)));
  if (!fonts.length) return console.log(`  sin fuentes: ${org}/${r.name}`);
  if (!lic) return console.log(`  fuera por licencia: ${org}/${r.name} (${r.license?.spdx_id})`);
  // Un solo formato y sin variables si hay estáticas: es lo que entienden todas las apps de diseño
  const otf = fonts.filter((f) => /\.otf$/i.test(f));
  if (otf.length) fonts = otf;
  const statics = fonts.filter((f) => !/variable|\[|-VF\b|\bVF\b/i.test(rel(f)));
  if (statics.length) fonts = statics;

  const seen = new Set();
  for (const f of fonts.sort()) {
    const base = path.basename(f).toLowerCase();
    if (seen.has(base)) continue;
    seen.add(base);
    let d;
    try { d = describe(f); } catch { console.log(`  ilegible: ${rel(f)}`); continue; }
    if (!d.family) continue;
    const owner = out.get(d.family);
    if (owner && owner.repo !== `${org}/${r.name}`) continue; // la misma familia en dos repositorios: gana el primero
    const entry = owner ?? { family: d.family, category: categoryOf(d.family), designers: d.designer ? [d.designer] : [], popularity: 9999, repo: `${org}/${r.name}`, sha, ...lic, styles: [], files: {}, names: {} };
    // Dos estilos con el mismo peso (p. ej. Condensed) reciben clave propia: "400-2", "400-2i"
    const tail = d.italic ? 'i' : '';
    let style = `${d.weight}${tail}`;
    for (let i = 2; entry.files[style]; i++) style = `${d.weight}-${i}${tail}`;
    entry.styles.push(style);
    entry.files[style] = rel(f);
    // Mismo peso que otro estilo: sin su nombre real saldrían dos "Regular" iguales
    if (style.includes('-')) entry.names[style] = /^(regular|italic|)$/i.test(d.subfamily) ? path.basename(f).replace(/\.\w+$/, '') : d.subfamily;
    out.set(d.family, entry);
  }
}

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fv-libres-'));
  const out = new Map();
  try {
    for (const org of ORGS) {
      console.log(org);
      for (const r of gh(`users/${org}/repos?per_page=100`)) if (!r.fork) await repo(org, r, root, out);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
  const list = [...out.values()].sort((a, b) => a.family.localeCompare(b.family));
  fs.writeFileSync(path.join(__dirname, '..', 'libres.json'), JSON.stringify(list, null, 1) + '\n');
  console.log(`${list.length} familias, ${list.reduce((s, f) => s + f.styles.length, 0)} estilos`);
})();
