// El catálogo incluido solo puede traer licencias con uso comercial y personal, y claves que la app sepa leer
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { splitKey } = require('../font-names');
const catalog = require('../libres.json');

test('solo licencias permitidas y archivos fijados por commit', () => {
  assert.ok(catalog.length > 0);
  for (const f of catalog) {
    assert.ok(['OFL', 'MIT', 'Apache-2.0'].includes(f.license), f.family);
    assert.ok(['github', 'revisada'].includes(f.licenseFrom), f.family + ': licencia sin revisar');
    assert.match(f.sha, /^[0-9a-f]{40}$/, f.family);
  }
});

test('cada estilo tiene archivo y su clave se interpreta bien', () => {
  for (const f of catalog) for (const style of f.styles) {
    assert.match(f.files[style], /\.(otf|ttf)$/i, f.family);
    const key = splitKey(f.family + ':' + style);
    assert.equal(key.style, style);
    assert.equal(key.italic, style.endsWith('i'));
    if (style.includes('-')) assert.ok(f.names[style], f.family + ': estilo sin nombre');
    assert.ok(key.weight >= 1 && key.weight <= 1000, f.family);
  }
});
