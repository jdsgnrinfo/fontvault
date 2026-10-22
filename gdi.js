// Activa fuentes en Windows sin instalarlas (AddFontResourceW), como FontBase.
const koffi = require('koffi');

const gdi32 = koffi.load('gdi32.dll');
const user32 = koffi.load('user32.dll');
const AddFontResourceW = gdi32.func('int __stdcall AddFontResourceW(str16 file)');
const RemoveFontResourceW = gdi32.func('int __stdcall RemoveFontResourceW(str16 file)');
const PostMessageW = user32.func('int __stdcall PostMessageW(intptr hwnd, uint msg, uintptr wp, intptr lp)');

const HWND_BROADCAST = 0xffff;
const WM_FONTCHANGE = 0x001d;

// Avisa a las demás apps (Photoshop, Figma...) para que recarguen su lista
const notify = () => PostMessageW(HWND_BROADCAST, WM_FONTCHANGE, 0, 0);

exports.activate = (file) => { const ok = AddFontResourceW(file) > 0; if (ok) notify(); return ok; };
exports.deactivate = (file) => { const ok = RemoveFontResourceW(file) !== 0; if (ok) notify(); return ok; };

// Ventana sin marco grueso: Windows no dibuja el borde de 1px (#202020 en modo oscuro), pero tampoco
// redondea las esquinas por su cuenta. Se lo pedimos con DWMWA_WINDOW_CORNER_PREFERENCE = 33, DWMWCP_ROUND = 2
const dwmapi = koffi.load('dwmapi.dll');
const DwmSetWindowAttribute = dwmapi.func('int __stdcall DwmSetWindowAttribute(intptr hwnd, uint attr, _In_ uint32_t *value, uint size)');

exports.roundCorners = (handle) => {
  try {
    const hwnd = handle.length >= 8 ? Number(handle.readBigUInt64LE(0)) : handle.readUInt32LE(0);
    return DwmSetWindowAttribute(hwnd, 33, [2], 4) === 0;
  } catch { return false; } // Windows 10 no tiene esquinas redondeadas
};
