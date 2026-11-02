// Traducción de búsquedas de iconos de español a inglés (src/es-en.ts)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateQuery, translateQueries, needsOnline, cleanTranslation } from '../src/es-en.ts';

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

test('entiende femenino, plural en -ces y expresiones', () => {
  assert.equal(translateQuery('flecha roja'), 'arrow red');
  assert.equal(translateQuery('luces'), 'light');
  assert.equal(translateQuery('lápices'), 'pencil');
  assert.equal(translateQuery('me gusta'), 'like');
  assert.equal(translateQuery('base de datos'), 'database');
  assert.equal(translateQuery('pantalla completa'), 'fullscreen');
});

test('busca también sinónimos, sin pasarse del límite', () => {
  assert.deepEqual(translateQueries('casa'), ['home', 'house']);
  assert.ok(translateQueries('correo').includes('envelope'));
  assert.ok(translateQueries('usuario flecha').length <= 4);
});

test('no confunde palabras con propiedades internas de JavaScript', () => {
  assert.equal(translateQuery('constructor'), null);
  assert.deepEqual(translateQueries('toString'), []);
});

test('las expresiones también funcionan en plural', () => {
  assert.equal(translateQuery('redes sociales'), 'social');
  assert.equal(translateQuery('tarjeta de crédito'), 'card credit');
});

test('detecta lo que el diccionario no conoce y limpia la traducción', () => {
  assert.equal(needsOnline('casa'), false);
  assert.equal(needsOnline('base de datos'), false);
  assert.equal(needsOnline('dinosaurio'), true);
  assert.equal(needsOnline('flecha dinosaurio'), true);
  assert.equal(cleanTranslation('The Blue Octopus.'), 'blue octopus');
  assert.equal(cleanTranslation('to select'), 'select');
});
