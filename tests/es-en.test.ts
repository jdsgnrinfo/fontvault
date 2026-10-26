// Traducción de búsquedas de iconos de español a inglés (src/es-en.ts)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateQuery } from '../src/es-en.ts';

test('traduce palabras con tildes y plurales', () => {
  assert.equal(translateQuery('casas'), 'home');
  assert.equal(translateQuery('corazón'), 'heart');
  assert.equal(translateQuery('configuración'), 'settings');
});

test('quita palabras de enlace y las que no conoce', () => {
  assert.equal(translateQuery('flecha hacia arriba'), 'arrow up');
  assert.equal(translateQuery('papelera de reciclaje'), 'trash recycle');
  assert.equal(translateQuery('carrito de compras'), 'cart shopping');
});

test('no toca lo que ya está en inglés', () => {
  assert.equal(translateQuery('home'), null);
  assert.equal(translateQuery(''), null);
});
