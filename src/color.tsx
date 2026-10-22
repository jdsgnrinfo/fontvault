import { useEffect, useRef, useState } from 'react';

// Selector de color propio y sencillo: área de saturación/brillo, barra de tono y HEX
type Hsv = { h: number; s: number; v: number };

function hexToHsv(hex: string): Hsv {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { h: 0, s: 0, v: 0.15 };
  const n = parseInt(m[1], 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: Hsv) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255).toString(16).padStart(2, '0');
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

// Convierte un arrastre del puntero en valores 0..1 dentro de un elemento
function useDrag(onMove: (x: number, y: number) => void) {
  return (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent | React.PointerEvent) => {
      const r = el.getBoundingClientRect();
      onMove(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)));
    };
    move(e);
    const up = () => { el.removeEventListener('pointermove', move as any); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', move as any);
    el.addEventListener('pointerup', up);
  };
}

export function ColorButton({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [text, setText] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (hsvToHex(hsv) !== value.toLowerCase()) setHsv(hexToHsv(value)); setText(value); }, [value]);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const set = (next: Hsv) => { setHsv(next); onChange(hsvToHex(next)); };
  const dragSV = useDrag((x, y) => set({ ...hsv, s: x, v: 1 - y }));
  const dragH = useDrag((x) => set({ ...hsv, h: x * 360 }));

  return (
    <div className="cpick" ref={ref}>
      <button className="cpick-swatch" style={{ background: value }} onClick={() => setOpen((o) => !o)}
        aria-label={label} aria-expanded={open} data-tip={label} />
      {open && (
        <div className="cpick-pop" role="dialog" aria-label={label}>
          <div className="cpick-sv" style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }} onPointerDown={dragSV}>
            <span style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv) }} />
          </div>
          <div className="cpick-hue" onPointerDown={dragH}>
            <span style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }} />
          </div>
          <div className="cpick-row">
            <span className="cpick-preview" style={{ background: value }} />
            <input value={text} spellCheck={false} aria-label="Color en hexadecimal"
              onChange={(e) => { setText(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase()); }} />
          </div>
        </div>
      )}
    </div>
  );
}
