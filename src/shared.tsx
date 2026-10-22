import { useEffect, useRef, useState } from 'react';

export const svg = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
export const IconBack = () => <svg {...svg}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
export const IconReset = () => <svg {...svg}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>;
export const IconHeart = () => <svg {...svg} width={20} height={20}><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.8 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.9 1.3-1.8 2.9-2.9 4.9-2.9 3.3 0 5.5 3.1 4.3 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" /></svg>;
export const IconGear = () => <svg {...svg}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;

// Carga más elementos automáticamente al llegar al final de una lista
export function LoadMore({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && onVisible(), { rootMargin: "600px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  });
  return <div ref={ref} style={{ height: 1 }} />;
}

export function NavItem({ label, count, dot, icon, tone, selected, onClick, onRemove }: {
  label: string; count?: number; dot?: 'on' | 'off' | 'folder'; icon?: React.ReactNode; tone?: 'green';
  selected: boolean; onClick: () => void; onRemove?: () => void;
}) {
  return (
    <div className={'nav-item' + (selected ? ' selected' : '')}>
      <button className="nav-main" onClick={onClick}>
        {icon ? <span className={'nav-icon' + (tone ? ' ' + tone : '')} aria-hidden="true">{icon}</span> : dot && <span className={'nav-dot ' + dot} />}
        <span className="nav-label">{label}</span>
        {count !== undefined && <span className="nav-count">{count}</span>}
      </button>
      {onRemove && <button className="nav-remove" onClick={onRemove} aria-label={'Quitar ' + label}>×</button>}
    </div>
  );
}

// Tooltip global con el aspecto del Tooltip de Arc: cualquier elemento con data-tip lo muestra.
// Uno solo para toda la app (en vez de un componente por elemento) para que la cuadrícula de iconos siga ligera.
const TIP_DELAY = 500;
const TIP_WARM = 400; // tras cerrar uno, el siguiente aparece al instante durante este tiempo

export function GlobalTooltip() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean; instant: boolean } | null>(null);
  useEffect(() => {
    let timer = 0, lastClose = 0, current: HTMLElement | null = null;
    const show = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const below = r.top < 56;
      // Se mantiene dentro de la ventana aunque el elemento esté pegado a un borde
      const x = Math.min(window.innerWidth - 128, Math.max(128, r.left + r.width / 2));
      setTip({ text: el.dataset.tip!, x, y: below ? r.bottom + 8 : r.top - 8, below, instant: performance.now() - lastClose < TIP_WARM });
    };
    const hide = () => {
      clearTimeout(timer);
      if (current) lastClose = performance.now();
      current = null;
      setTip(null);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null;
      if (el === current) return;
      hide();
      if (!el || !el.dataset.tip) return;
      current = el;
      const warm = performance.now() - lastClose < TIP_WARM;
      timer = window.setTimeout(() => current === el && show(el), warm ? 0 : TIP_DELAY);
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('wheel', hide, { passive: true, capture: true });
    window.addEventListener('blur', hide);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('wheel', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, []);
  if (!tip) return null;
  return (
    <div role="tooltip" className={'arc-tip' + (tip.below ? ' below' : '') + (tip.instant ? ' instant' : '')}
      style={{ left: tip.x, top: tip.y }}>{tip.text}</div>
  );
}

// La ventana no tiene marco grueso de Windows (así no aparece su borde oscuro de 1px),
// así que el redimensionado desde bordes y esquinas lo hacen estas zonas invisibles
const MIN_W = 900, MIN_H = 560;
type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export function ResizeHandles() {
  const w = (window as any).api.window;
  const [max, setMax] = useState(false);
  useEffect(() => { w.isMaximized().then(setMax); w.onMaximized(setMax); }, []);
  if (max) return null;

  const start = async (e: React.PointerEvent<HTMLDivElement>, edge: Edge) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.screenX, sy = e.screenY;
    const b0 = await w.getBounds();
    let frame = 0;
    const move = (ev: PointerEvent) => {
      const dx = ev.screenX - sx, dy = ev.screenY - sy;
      let { x, y, width, height } = b0;
      if (edge.includes('e')) width = Math.max(MIN_W, b0.width + dx);
      if (edge.includes('s')) height = Math.max(MIN_H, b0.height + dy);
      if (edge.includes('w')) { width = Math.max(MIN_W, b0.width - dx); x = b0.x + b0.width - width; }
      if (edge.includes('n')) { height = Math.max(MIN_H, b0.height - dy); y = b0.y + b0.height - height; }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => w.setBounds({ x, y, width, height }));
    };
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  return (
    <>
      {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as Edge[]).map((edge) => (
        <div key={edge} className={'resize-handle ' + edge} onPointerDown={(e) => start(e, edge)} />
      ))}
    </>
  );
}

// Cuadrícula virtual: solo dibuja las filas visibles (más un margen). Con colecciones de miles de iconos,
// dibujarlos todos llevaba la interfaz a más de 3 GB de RAM.
export function VirtualGrid({ count, minCell, gap, cellHeight, className, render, onRange }: {
  count: number; minCell: number; gap: number; cellHeight?: number; className?: string;
  render: (i: number) => React.ReactNode; onRange?: (start: number, end: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, top: 0, viewH: 800 });

  useEffect(() => {
    const el = ref.current!;
    const scroller = el.closest('.list') as HTMLElement;
    const update = () => {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      setBox({ width: el.clientWidth, top: -top, viewH: scroller.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el); ro.observe(scroller);
    scroller.addEventListener('scroll', update, { passive: true });
    return () => { ro.disconnect(); scroller.removeEventListener('scroll', update); };
  }, []);

  const cols = Math.max(1, Math.floor((box.width + gap) / (minCell + gap)));
  const cell = box.width ? (box.width - gap * (cols - 1)) / cols : minCell;
  const h = cellHeight ?? cell; // sin alto fijo, las celdas son cuadradas
  const rowH = h + gap;
  const rows = Math.ceil(count / cols);
  const first = Math.max(0, Math.floor(box.top / rowH) - 3);
  const last = Math.min(rows, Math.ceil((box.top + box.viewH) / rowH) + 3);
  const start = first * cols, end = Math.min(count, last * cols);

  useEffect(() => { onRange?.(start, end); }, [start, end]);

  const items = [];
  for (let i = start; i < end; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    items.push(<div key={i} style={{ position: 'absolute', left: c * (cell + gap), top: r * rowH, width: cell, height: h }}>{render(i)}</div>);
  }
  return <div ref={ref} className={className} style={{ position: 'relative', height: Math.max(0, rows * rowH - gap) }}>{items}</div>;
}

// Sonidos de favoritos generados con Web Audio (sin archivos), inspirados en los de mensajes de iOS
// pero originales: un "swoosh" corto. Al activar sube; al desactivar es el mismo al revés y más grave
let audio: AudioContext | null = null;
let soundsOn = true;

function swoosh(ctx: AudioContext, now: number, down: boolean) {
  // Tono que se desliza: hacia arriba al activar, hacia abajo y más grave al desactivar
  const [f0, f1] = down ? [900, 240] : [420, 1500];
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, now);
  osc.frequency.exponentialRampToValueAtTime(f1, now + 0.14);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.05, now + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.22);
  // Soplo de aire: ruido filtrado que barre en la misma dirección
  const [n0, n1] = down ? [2600, 500] : [900, 4000];
  const len = Math.floor(ctx.sampleRate * 0.2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(n0, now);
  bp.frequency.exponentialRampToValueAtTime(n1, now + 0.16);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0, now);
  ng.gain.linearRampToValueAtTime(0.035, now + 0.04);
  ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
  noise.connect(bp).connect(ng).connect(ctx.destination);
  noise.start(now); noise.stop(now + 0.2);
}

export function playFavoriteSound(added = true) {
  if (!soundsOn) return; // el interruptor "Efectos de sonido" de Ajustes controla todos los sonidos
  try {
    audio ??= new AudioContext();
    swoosh(audio, audio.currentTime, !added);
  } catch {}
}

// "Tic" al hacer scroll, inspirado en las ruedas selectoras de iOS: un clic muy corto cada TICK_PX
// de desplazamiento, con un mínimo entre clics para que no se amontonen al ir rápido
const TICK_PX = 90;
const TICK_GAP_MS = 45;

function tick(ctx: AudioContext) {
  const now = ctx.currentTime;
  // Ráfaga de ruido de 6 ms filtrada (el "clac" mecánico) + un tono corto que le da cuerpo
  const len = Math.floor(ctx.sampleRate * 0.006);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'bandpass'; hp.frequency.value = 3200; hp.Q.value = 2;
  const ng = ctx.createGain();
  ng.gain.value = 0.05;
  noise.connect(hp).connect(ng).connect(ctx.destination);
  noise.start(now);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.value = 1700;
  g.gain.setValueAtTime(0.018, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.03);
}

// Tic suelto (por ejemplo al mover un deslizador), con el mismo límite de frecuencia que el scroll
let lastSliderTick = 0;
export function playTick() {
  const t = performance.now();
  if (!soundsOn || t - lastSliderTick < TICK_GAP_MS) return;
  lastSliderTick = t;
  try { audio ??= new AudioContext(); tick(audio); } catch {}
}

export function useScrollTicks(enabled: boolean) {
  soundsOn = enabled;
  useEffect(() => {
    if (!enabled) return;
    const last = new WeakMap<Element, number>();
    let acc = 0, lastTick = 0;
    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!(el instanceof HTMLElement) || !el.matches('.list, .sidebar nav')) return;
      const prev = last.get(el) ?? el.scrollTop;
      last.set(el, el.scrollTop);
      acc += Math.abs(el.scrollTop - prev);
      const t = performance.now();
      if (acc >= TICK_PX && t - lastTick >= TICK_GAP_MS) {
        acc = 0; lastTick = t;
        try { audio ??= new AudioContext(); tick(audio); } catch {}
      }
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [enabled]);
}
