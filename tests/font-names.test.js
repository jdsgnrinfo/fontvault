// Reglas que deciden qué archivo se descarga para cada estilo y en qué categoría cae cada familia (font-names.js)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { splitKey, styleName, category } = require('../font-names');

test('separa familia, peso y cursiva', () => {
  assert.deepEqual(splitKey('Roboto:700i'), { family: 'Roboto', style: '700i', weight: 700, italic: true });
  assert.deepEqual(splitKey('Satoshi'), { family: 'Satoshi', style: '400', weight: 400, italic: false });
});

test('nombra los estilos como en los archivos', () => {
  assert.equal(styleName(400, false), 'Regular');
  assert.equal(styleName(400, true), 'Italic');
  assert.equal(styleName(700, true), 'BoldItalic');
  assert.equal(styleName(650, false), 'Regular'); // peso desconocido
});

test('unifica las categorías de los tres proveedores', () => {
  assert.equal(category('Sans Serif'), 'Sans Serif');      // Google
  assert.equal(category('Serif, Display'), 'Display');     // Fontshare
  assert.equal(category('Handwritten'), 'Handwriting');    // Fontshare
  assert.equal(category('monospace'), 'Monospace');        // Fontsource
  assert.equal(category('Slab'), 'Serif');
});
