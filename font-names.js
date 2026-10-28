// Reglas puras de nombres de estilo y categorías de los proveedores (sin Electron, para poder probarlas)
const WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
// "Familia:700i" → familia, peso 700 y cursiva
const splitKey = (key) => { const [family, style = '400'] = key.split(':'); return { family, style, weight: parseInt(style, 10) || 400, italic: style.endsWith('i') }; };
// Nombre del estilo como aparece en los archivos: "Bold", "BoldItalic", "Italic"
const styleName = (weight, italic) => { const w = WEIGHTS[weight] ?? 'Regular'; return italic ? (w === 'Regular' ? 'Italic' : `${w}Italic`) : w; };

// Categorías comunes para el filtro, sea cual sea el proveedor
function category(raw) {
  const c = String(raw).toLowerCase();
  if (c.includes('mono')) return 'Monospace';
  if (c.includes('hand') || c.includes('script')) return 'Handwriting';
  if (c.includes('display') || c.includes('blackletter')) return 'Display';
  if (c.includes('sans')) return 'Sans Serif';
  if (c.includes('serif') || c.includes('slab')) return 'Serif';
  return 'Display';
}

module.exports = { WEIGHTS, splitKey, styleName, category };
