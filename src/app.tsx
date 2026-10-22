import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@/components/arc/foundation.css';
import './app.css';
import { SearchField } from '@/components/arc/search-field/search-field';
import { Slider } from '@/components/arc/slider/slider';
import SegmentedControl from '@/components/arc/segmented-control/segmented-control';
import { Button } from '@/components/arc/button/button';
import { Select } from '@/components/arc/select/select';
import { Input } from '@/components/arc/input/input';
import { Switch } from '@/components/arc/switch/switch';
import { TextFont16Regular, Heart16Regular, CheckmarkCircle16Regular, Circle16Regular, Folder16Regular, FolderOpen16Regular,
  Shapes16Regular, WeatherMoon16Regular, Eye16Regular, TextQuote16Regular, Settings16Regular, ChevronDown12Regular, ChevronRight12Regular, ChevronUp16Regular, Checkmark16Regular, Globe16Regular } from '@fluentui/react-icons';
import { svg, IconBack, IconReset, IconHeart, IconGear, LoadMore, NavItem, GlobalTooltip, ResizeHandles, playFavoriteSound, useScrollTicks, playTick } from './shared';
import { IconsSidebar, IconsMain, useIcons } from './icons';

declare global { interface Window { api: any } }

type FontFile = { file: string; folder: string; format: string; family: string; style: string; designer?: string };
type Family = { name: string; files: FontFile[]; formats: string; folders: Set<string>; designer: string; provider?: 'google'; category?: string; popularity?: number };
type GoogleEntry = { family: string; category: string; designers: string[]; popularity: number; styles: string[] };
type Filter = { kind: 'all' | 'favorites' | 'active' | 'inactive' | 'google' } | { kind: 'folder'; folder: string };

const PAGE = 60;
const DEFAULT_TEXT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789!@#$%^&()';
const REGULAR = /^(regular|book|normal|roman)$/i;
// Fuentes cargadas para la vista previa. Cada componente que muestra una fuente la "adquiere" y la "suelta"
// al salir de pantalla; las que nadie usa se liberan cuando hay más de MAX_IDLE, empezando por la más antigua.
// Antes se quedaban todas en memoria y la interfaz llegaba a ~500 MB tras recorrer la lista.
const MAX_IDLE = 40;
type Loaded = { name: Promise<string | null>; face?: FontFace; refs: number };
const loaded = new Map<string, Loaded>();
let faceId = 0;

function loadFace(file: string) {
  let entry = loaded.get(file);
  if (!entry) {
    const id = 'fv' + faceId++;
    const e: Loaded = { refs: 0, name: Promise.resolve(null) };
    e.name = window.api.readFont(file)
      .then((buf: ArrayBuffer) => new FontFace(id, buf).load())
      .then((face: FontFace) => { e.face = face; document.fonts.add(face); return id; })
      .catch(() => null);
    loaded.set(file, entry = e);
  } else {
    // Al reutilizarla pasa al final del orden (la más reciente)
    loaded.delete(file);
    loaded.set(file, entry);
  }
  entry.refs++;
  return entry.name;
}

// Al minimizar se liberan todas las fuentes que no están en pantalla
window.api.window.onTrim(() => {
  for (const [f, e] of [...loaded]) if (e.refs === 0) { if (e.face) document.fonts.delete(e.face); loaded.delete(f); }
});

function releaseFace(file: string) {
  const entry = loaded.get(file);
  if (entry) entry.refs = Math.max(0, entry.refs - 1);
  let idle = [...loaded].filter(([, e]) => e.refs === 0);
  for (const [f, e] of idle.slice(0, Math.max(0, idle.length - MAX_IDLE))) {
    if (e.face) document.fonts.delete(e.face);
    loaded.delete(f);
  }
}


// "400" → Regular, "700i" → Bold Italic (claves de estilo de Google Fonts)
const WEIGHT_NAMES: Record<string, string> = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const googleStyleName = (key: string) => {
  const italic = key.endsWith('i'), w = WEIGHT_NAMES[parseInt(key, 10)] ?? key;
  return italic ? (w === 'Regular' ? 'Italic' : `${w} Italic`) : w;
};
const GOOGLE_CATEGORIES: Record<string, string> = { 'Sans Serif': 'Sans Serif', Serif: 'Serif', Display: 'Display', Handwriting: 'Manuscrita', Monospace: 'Monoespaciada' };

const folderName = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() ?? p;
const SEP = '\\';
const inside = (file: string, dir: string) => file.startsWith(dir + SEP);

type FolderNode = { path: string; name: string; children: FolderNode[]; families: Set<string> };

// Reconstruye el árbol de subcarpetas de una carpeta raíz a partir de sus archivos
function buildTree(root: string, fonts: FontFile[]): FolderNode {
  const tree: FolderNode = { path: root, name: folderName(root), children: [], families: new Set() };
  for (const f of fonts) {
    if (f.folder !== root) continue;
    tree.families.add(f.family);
    const parts = f.file.slice(root.length + 1).split(SEP).slice(0, -1);
    let node = tree;
    for (const part of parts) {
      let child = node.children.find((c) => c.name === part);
      if (!child) node.children.push(child = { path: node.path + SEP + part, name: part, children: [], families: new Set() });
      child.families.add(f.family);
      node = child;
    }
  }
  const sort = (n: FolderNode) => { n.children.sort((a, b) => a.name.localeCompare(b.name)); n.children.forEach(sort); };
  sort(tree);
  return tree;
}

function FolderTree({ node, depth, selected, onSelect, onRemove }: {
  node: FolderNode; depth: number; selected: string | null; onSelect: (path: string) => void; onRemove?: () => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  return (
    <>
      <div className={'nav-item' + (selected === node.path ? ' selected' : '')} style={{ paddingLeft: depth * 14 }}>
        <button className="nav-caret" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Contraer' : 'Expandir'}
          aria-expanded={open} style={{ visibility: hasChildren ? 'visible' : 'hidden' }}>{open ? <ChevronDown12Regular /> : <ChevronRight12Regular />}</button>
        <button className="nav-main" onClick={() => onSelect(node.path)}>
          <span className="nav-icon" aria-hidden="true">{open && hasChildren ? <FolderOpen16Regular /> : <Folder16Regular />}</span>
          <span className="nav-label" data-tip={node.path}>{node.name}</span>
          <span className="nav-count">{node.families.size}</span>
        </button>
        {onRemove && <button className="nav-remove" onClick={onRemove} aria-label={'Quitar ' + node.name}>×</button>}
      </div>
      {open && node.children.map((c) => (
        <FolderTree key={c.path} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </>
  );
}

function FamilyRow({ family, isActive, busy, showSource, text, size, onToggle, onOpen }: {
  family: Family; isActive: boolean; busy?: boolean; showSource?: boolean; text: string; size: number; onToggle: () => void; onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [face, setFace] = useState<string | null>(null);
  const preview = family.files.find((f) => REGULAR.test(f.style)) ?? family.files[0];

  // La fuente se carga al acercarse a la pantalla y se suelta al alejarse, para no acumular memoria
  useEffect(() => {
    let held = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !held) { held = true; loadFace(preview.file).then((n) => held && setFace(n)); }
      else if (!e.isIntersecting && held) { held = false; setFace(null); releaseFace(preview.file); }
    }, { rootMargin: '600px' });
    io.observe(ref.current!);
    return () => { io.disconnect(); if (held) releaseFace(preview.file); };
  }, [preview.file]);

  return (
    <div className="row family-row" ref={ref} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && onOpen()}>
      <div className="row-meta">
        <button className={'dot' + (isActive ? ' on' : '') + (busy ? ' busy' : '')} disabled={busy} onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-label={(isActive ? 'Desactivar ' : 'Activar ') + family.name} aria-pressed={isActive} />
        <span className="row-name">{family.name}</span>
        {/* En las vistas que mezclan orígenes, una etiqueta indica si la fuente es local o de un proveedor */}
        {showSource && (family.provider === 'google'
          ? <span className="source-tag provider">Google Fonts</span>
          : <span className="source-tag local">Local</span>)}
        <span>{family.files.length} {family.files.length === 1 ? "estilo" : "estilos"} · {family.formats}</span>
        {family.designer && <><span className="sep">|</span><span className="designer">{family.designer}</span></>}
      </div>
      <div className="sample" style={{ fontFamily: face ? `"${face}"` : 'inherit', fontSize: size, opacity: face ? 1 : 0.25 }}>
        {text || DEFAULT_TEXT}
      </div>
    </div>
  );
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÉÍÓÚÑáéíóúñüç.,:;¡!¿?"\'()[]{}@#$%&*+-=/\\<>€£¥©®™';
const weightOrder = (s: string) => {
  const w = ['thin', 'hairline', 'extralight', 'ultralight', 'light', 'regular', 'book', 'medium', 'semibold', 'demibold', 'bold', 'extrabold', 'heavy', 'black'];
  const k = s.toLowerCase().replace(/[\s-]/g, '');
  const i = w.findIndex((x) => k.startsWith(x));
  return (i < 0 ? 5 : i) * 2 + (/italic|oblique/i.test(s) ? 1 : 0);
};

function useFace(file: string) {
  const [face, setFace] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadFace(file).then((n) => alive && setFace(n));
    return () => { alive = false; releaseFace(file); };
  }, [file]);
  return face;
}

function StyleRow({ font, isActive, text, size, onToggle }: {
  font: FontFile; isActive: boolean; text: string; size: number; onToggle?: () => void;
}) {
  const face = useFace(font.file);
  return (
    <div className="row">
      <div className="row-meta">
        {onToggle && <button className={'dot' + (isActive ? ' on' : '')} onClick={onToggle}
          aria-label={(isActive ? 'Desactivar ' : 'Activar ') + font.style} aria-pressed={isActive} />}
        <span className="row-name static">{font.style}</span>
        <span>{font.format}</span>
      </div>
      <div className="sample" style={{ fontFamily: face ? `"${face}"` : 'inherit', fontSize: size, opacity: face ? 1 : 0.25 }}>
        {text || DEFAULT_TEXT}
      </div>
    </div>
  );
}

function GlyphGrid({ file }: { file: string }) {
  const face = useFace(file);
  // Usamos los caracteres reales de la fuente; si no se pueden leer, un conjunto básico
  const [chars, setChars] = useState<string[] | null>(null);
  useEffect(() => {
    setChars(null);
    window.api.fontInfo(file).then((info: any) =>
      setChars(info?.chars?.length ? info.chars.map((c: number) => String.fromCodePoint(c)) : [...GLYPHS]));
  }, [file]);
  if (!chars) return <p className="empty">Leyendo glifos…</p>;
  return (
    <div className="glyphs">
      <p className="glyph-count">{chars.length} caracteres</p>
      <div className="glyph-grid" style={{ fontFamily: face ? `"${face}"` : 'inherit', opacity: face ? 1 : 0.25 }}>
        {chars.map((ch) => (
          <span key={ch} data-tip={'U+' + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}>{ch}</span>
        ))}
      </div>
    </div>
  );
}

const WATERFALL: [number, string][] = [
  [72, 'Elegir y combinar tipografías'],
  [48, 'Cada letra cuenta una historia distinta según su tamaño y su peso.'],
  [32, 'Una buena familia tipográfica se mantiene legible tanto en un titular enorme como en una nota al pie diminuta.'],
  [24, 'El ritmo de un texto depende del espacio entre letras, palabras y líneas. Cuando ese equilibrio funciona, el lector deja de ver la tipografía y solo percibe el mensaje.'],
  [16, 'Para textos largos conviene revisar la altura de la x, la apertura de los ojos de las letras y el contraste entre trazos finos y gruesos. Estos detalles deciden si una página se lee con comodidad o cansa a los pocos párrafos. Pruébala siempre con contenido real: números, signos de puntuación y palabras largas.'],
  [12, 'Los tamaños pequeños son la prueba más exigente. Aquí se notan los problemas de espaciado, los glifos que se empastan y las cifras demasiado estrechas. Si una fuente sigue siendo clara a este tamaño, es una buena candidata para interfaces, formularios y notas al pie. 0123456789 · ¿Qué tal? ¡Perfecto!'],
];

function Waterfall({ file }: { file: string }) {
  const face = useFace(file);
  return (
    <div className="waterfall" style={{ fontFamily: face ? `"${face}"` : 'inherit', opacity: face ? 1 : 0.25 }}>
      {WATERFALL.map(([px, line]) => (
        <div className="wf-row" key={px}>
          <p style={{ fontSize: px }}>{line}</p>
          <span>{px}px</span>
        </div>
      ))}
    </div>
  );
}

const NAME_LABELS: Record<string, string> = {
  copyright: 'Copyright', designer: 'Diseñador', designerURL: 'URL del diseñador', fontFamily: 'Familia',
  fontSubfamily: 'Subfamilia', fullName: 'Nombre completo', license: 'Licencia', licenseURL: 'URL de la licencia',
  manufacturer: 'Fabricante', manufacturerURL: 'URL del fabricante', postScriptName: 'Nombre PostScript',
  uniqueID: 'ID único', version: 'Versión', description: 'Descripción', trademark: 'Marca registrada',
};

const FEATURES: Record<string, [string, string]> = {
  liga: ['fi', 'Ligaduras estándar'], dlig: ['ct', 'Ligaduras discrecionales'], clig: ['fl', 'Ligaduras contextuales'],
  kern: ['AV', 'Kerning'], calt: ['ab', 'Alternativas contextuales'], salt: ['a', 'Alternativas estilísticas'],
  swsh: ['Q', 'Floreos'], smcp: ['Aa', 'Versalitas'], c2sc: ['AA', 'Mayúsculas a versalitas'], onum: ['123', 'Números de estilo antiguo'],
  lnum: ['123', 'Números de caja alta'], tnum: ['123', 'Números tabulares'], pnum: ['123', 'Números proporcionales'],
  frac: ['½', 'Fracciones'], sups: ['x²', 'Superíndices'], subs: ['x₂', 'Subíndices'], ordn: ['1º', 'Ordinales'],
  zero: ['0', 'Cero barrado'], case: ['(H)', 'Formas sensibles a mayúsculas'], mark: ['é', 'Posicionamiento de acentos'],
  mkmk: ['ệ', 'Acentos sobre acentos'], locl: ['ş', 'Formas localizadas'], ccmp: ['é', 'Composición de glifos'],
};

function Details({ file }: { file: string }) {
  const [info, setInfo] = useState<any>(undefined);
  useEffect(() => { setInfo(undefined); window.api.fontInfo(file).then(setInfo); }, [file]);
  if (info === undefined) return <p className="empty">Leyendo información…</p>;
  if (!info) return <p className="empty">No se pudo leer la información de este archivo (formato no compatible).</p>;
  return (
    <div className="details">
      <h3>Funciones OpenType</h3>
      {info.features.length === 0 ? <p className="muted">Ninguna</p> : (
        <div className="features">
          {info.features.map((tag: string) => {
            const [sample, label] = FEATURES[tag] ?? (/^ss[0-9]{2}$/.test(tag) ? ['Aa', 'Conjunto estilístico ' + +tag.slice(2)] : ['', tag]);
            return <span key={tag} className="feature" data-tip={tag}><b>{sample || tag}</b>{label}</span>;
          })}
        </div>
      )}
      <h3>Información del archivo</h3>
      <table>
        <tbody>
          {Object.entries(info.names).map(([k, v]) => (
            <tr key={k}><th>{NAME_LABELS[k] ?? k}</th><td>{v as string}</td></tr>
          ))}
          <tr><th>Glifos</th><td>{info.glyphCount}</td></tr>
          <tr><th>Archivo</th><td>{file.startsWith('gf:') ? 'Google Fonts' : file}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function FamilyDetail({ family, active, text, size, onBack, onToggleFiles, isFavorite, onFavorite, familyActive, busy, onToggleFamily }: {
  family: Family; active: Set<string>; text: string; size: number;
  onBack: () => void; onToggleFiles: (files: string[], on: boolean) => void; isFavorite: boolean; onFavorite: () => void;
  familyActive: boolean; busy: boolean; onToggleFamily: () => void;
}) {
  const [tab, setTab] = useState('styles');
  const styles = useMemo(() => [...family.files].sort((a, b) => weightOrder(a.style) - weightOrder(b.style)), [family]);
  const [styleFile, setStyleFile] = useState((styles.find((f) => REGULAR.test(f.style)) ?? styles[0]).file);
  const google = family.provider === 'google';
  const allOn = google ? familyActive : family.files.every((f) => active.has(f.file));

  return (
    <div className="detail">
      <div className="detail-head">
        <Button variant="secondary" size="sm" className="icon-only" onClick={onBack} aria-label="Volver" data-tip="Volver"><IconBack /></Button>
        <div className="detail-title">
          <div className="detail-name">
            <h1>{family.name}</h1>
            <button className={"fav" + (isFavorite ? " on" : "")} onClick={onFavorite} aria-pressed={isFavorite}
              aria-label={isFavorite ? "Quitar de favoritas" : "Añadir a favoritas"} data-tip={isFavorite ? "Quitar de favoritas" : "Añadir a favoritas"}><IconHeart /></button>
          </div>
          <span>{family.files.length} {family.files.length === 1 ? 'estilo' : 'estilos'} · {family.formats}</span>
        </div>
        <span className="seg"><SegmentedControl label="Vista" value={tab} onValueChange={setTab}
          options={[{ value: 'styles', label: 'Estilos' }, { value: 'waterfall', label: 'Cascada' },
            { value: 'glyphs', label: 'Glifos' }, { value: 'details', label: 'Detalles' }]} /></span>
        <Button variant={allOn ? 'secondary' : 'primary'} size="sm" disabled={busy}
          onClick={() => (google ? onToggleFamily() : onToggleFiles(family.files.map((f) => f.file), !allOn))}>
          {busy ? 'Descargando…' : allOn ? 'Desactivar todo' : 'Activar todo'}
        </Button>
      </div>

      {tab === 'styles' ? styles.map((f) => (
        <StyleRow key={f.file} font={f} isActive={active.has(f.file)} text={text} size={size}
          onToggle={google ? undefined : () => onToggleFiles([f.file], !active.has(f.file))} />
      )) : (
        <div className="tab-body">
          {styles.length > 1 && tab !== 'details' && (
            <div className="style-select">
              <Select label="Estilo" value={styleFile} onValueChange={setStyleFile}
                options={styles.map((f) => ({ value: f.file, label: f.style }))} />
            </div>
          )}
          {tab === 'waterfall' && <Waterfall file={styleFile} />}
          {tab === 'glyphs' && <GlyphGrid file={styleFile} />}
          {tab === 'details' && <Details file={(styles.find((f) => REGULAR.test(f.style)) ?? styles[0]).file} />}
        </div>
      )}
    </div>
  );
}



type ScrollSpeed = 'slow' | 'normal' | 'fast';
type Settings = { samples: string[]; size: number; restoreActive: boolean; autoStart: boolean;
  hideToTray: boolean; scrollSpeed: ScrollSpeed; groupFamilies: boolean; theme: 'light' | 'dark'; scrollSound: boolean; version?: string };

const SCROLL_FACTOR: Record<ScrollSpeed, number> = { slow: 0.5, normal: 1, fast: 2 };

const SIZE_OPTIONS = [12, 14, 16, 18, 24, 32, 36, 42, 48, 64, 72, 96, 120].map((v) => ({ value: String(v), label: `${v}px` }));

function SettingRow({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div><strong>{title}</strong>{hint && <span>{hint}</span>}</div>
      {children}
    </div>
  );
}

function SettingsPage({ settings, onChange, folders, onAddFolder, onRemoveFolder, onClose }: {
  settings: Settings; onChange: (patch: Partial<Settings>) => void;
  folders: string[]; onAddFolder: () => void; onRemoveFolder: (folder: string) => void; onClose: () => void;
}) {
  const setSample = (i: number, value: string) => onChange({ samples: settings.samples.map((s, j) => (j === i ? value : s)) });
  return (
    <div className="list">
      <div className="settings-page">
        <div className="settings-head">
          <Button variant="secondary" size="sm" className="icon-only" onClick={onClose} aria-label="Volver" data-tip="Volver"><IconBack /></Button>
          <h1>Ajustes</h1>
        </div>

        <section>
          <h2><Folder16Regular />Carpetas de fuentes</h2>
          <p className="hint">FontVault lee las fuentes directamente de estas carpetas y sus subcarpetas. Los archivos no se copian ni se mueven.</p>
          {folders.length === 0 && <p className="hint">Todavía no has añadido ninguna carpeta.</p>}
          {folders.map((f) => (
            <div className="folder-line" key={f}>
              <span data-tip={f}>{f}</span>
              <Button variant="secondary" size="sm" onClick={() => onRemoveFolder(f)}>Quitar</Button>
            </div>
          ))}
          <div><Button variant="secondary" size="sm" onClick={onAddFolder}>Añadir carpeta…</Button></div>
        </section>

        <section>
          <h2><WeatherMoon16Regular />Apariencia</h2>
          <SettingRow title="Tema" hint="El modo oscuro también oscurece el panel de vista previa.">
            <span className="seg"><SegmentedControl label="Tema" value={settings.theme} onValueChange={(v) => onChange({ theme: v as 'light' | 'dark' })}
              options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]} /></span>
          </SettingRow>
        </section>

        <section>
          <h2><Eye16Regular />Visualización</h2>
          <SettingRow title="Velocidad de scroll de la lista">
            <div className="setting-select">
              <Select label="Velocidad de scroll de la lista" value={settings.scrollSpeed}
                onValueChange={(v) => onChange({ scrollSpeed: v as ScrollSpeed })}
                options={[{ value: 'slow', label: 'Lenta' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Rápida' }]} />
            </div>
          </SettingRow>
          <SettingRow title="Efectos de sonido">
            <Switch checked={settings.scrollSound} onCheckedChange={(v) => onChange({ scrollSound: v })} aria-label="Efectos de sonido" />
          </SettingRow>
          <SettingRow title="Agrupar fuentes en familias" hint="Si lo desactivas, cada estilo aparece como una fuente independiente en la lista.">
            <Switch checked={settings.groupFamilies} onCheckedChange={(v) => onChange({ groupFamilies: v })} aria-label="Agrupar fuentes en familias" />
          </SettingRow>
          <SettingRow title="Tamaño de fuente predeterminado">
            <div className="setting-select">
              <Select label="Tamaño de fuente predeterminado" value={String(settings.size)}
                onValueChange={(v) => onChange({ size: +v })}
                options={SIZE_OPTIONS.some((o) => +o.value === settings.size) ? SIZE_OPTIONS
                  : [...SIZE_OPTIONS, { value: String(settings.size), label: `${settings.size}px` }]} />
            </div>
          </SettingRow>
        </section>

        <section>
          <h2><TextQuote16Regular />Textos de ejemplo</h2>
          <p className="hint">El primero de la lista se usa como texto de vista previa predeterminado.</p>
          {settings.samples.map((s, i) => (
            <div className="sample-line" key={i}>
              <Input label={`Texto de ejemplo ${i + 1}`} value={s} onChange={(e) => setSample(i, e.target.value)} />
              <Button variant="ghost" size="sm" className="icon-only" aria-label="Eliminar texto" data-tip="Eliminar"
                disabled={settings.samples.length === 1}
                onClick={() => onChange({ samples: settings.samples.filter((_, j) => j !== i) })}>×</Button>
            </div>
          ))}
          <div><Button variant="secondary" size="sm" onClick={() => onChange({ samples: [...settings.samples, ''] })}>Añadir texto</Button></div>
        </section>

        <section>
          <h2><Settings16Regular />Comportamiento</h2>
          <SettingRow title="Ocultar en la bandeja al cerrar" hint="Al cerrar la ventana, FontVault sigue funcionando en la bandeja del sistema y tus fuentes siguen activas. Para salir, usa el menú del icono.">
            <Switch checked={settings.hideToTray} onCheckedChange={(v) => onChange({ hideToTray: v })} aria-label="Ocultar en la bandeja al cerrar" />
          </SettingRow>
          <SettingRow title="Reactivar fuentes al abrir" hint="Vuelve a activar las fuentes que estaban activas al cerrar la app.">
            <Switch checked={settings.restoreActive} onCheckedChange={(v) => onChange({ restoreActive: v })} aria-label="Reactivar fuentes al abrir" />
          </SettingRow>
          <SettingRow title="Iniciar con Windows" hint="Abre FontVault al iniciar sesión.">
            <Switch checked={settings.autoStart} onCheckedChange={(v) => onChange({ autoStart: v })} aria-label="Iniciar con Windows" />
          </SettingRow>
        </section>

        <p className="settings-about">FontVault {settings.version}</p>
      </div>
    </div>
  );
}

// Flecha a la derecha de la caja de texto: elige uno de los textos de ejemplo guardados en Ajustes
function SamplePicker({ samples, current, onPick }: { samples: string[]; current: string; onPick: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const list = samples.filter((t) => t.trim());
  return (
    <div className="sample-picker" ref={ref}>
      <button className={'sample-toggle' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)}
        aria-label="Textos predefinidos" aria-expanded={open}><ChevronUp16Regular /></button>
      {open && (
        <div className="sample-menu" role="listbox" aria-label="Textos predefinidos">
          {list.map((t, i) => (
            <div key={i} role="option" aria-selected={t === current} tabIndex={0}
              className={'sample-option' + (t === current ? ' on' : '')}
              onClick={() => { onPick(t); setOpen(false); }} onKeyDown={(e) => e.key === 'Enter' && (onPick(t), setOpen(false))}>
              <span>{t}</span>{t === current && <Checkmark16Regular />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Botones de ventana propios (la ventana no tiene marco de Windows)
function WindowControls() {
  const w = window.api.window;
  const [max, setMax] = useState(false);
  useEffect(() => { w.isMaximized().then(setMax); w.onMaximized(setMax); }, []);
  const ico = { width: 10, height: 10, viewBox: '0 0 10 10', fill: 'none', stroke: 'currentColor', strokeWidth: 1, 'aria-hidden': true };
  return (
    <div className="win-controls">
      <button onClick={w.minimize} aria-label="Minimizar" data-tip="Minimizar"><svg {...ico}><path d="M0 5.5h10" /></svg></button>
      <button onClick={w.toggleMaximize} aria-label={max ? 'Restaurar' : 'Maximizar'} data-tip={max ? 'Restaurar' : 'Maximizar'}>
        {max ? <svg {...ico}><path d="M2.5 2.5V.5h7v7h-2M.5 2.5h7v7h-7z" /></svg> : <svg {...ico}><rect x=".5" y=".5" width="9" height="9" /></svg>}
      </button>
      <button className="close" onClick={w.close} aria-label="Cerrar" data-tip="Cerrar"><svg {...ico}><path d="M.5.5l9 9M9.5.5l-9 9" /></svg></button>
    </div>
  );
}

function App() {
  const [fonts, setFonts] = useState<FontFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [query, setQuery] = useState('');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [size, setSize] = useState(42);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Aplicamos el tema a toda la página (los tokens de Arc y los nuestros cuelgan de data-theme)
  useEffect(() => { document.documentElement.dataset.theme = settings?.theme ?? 'light'; }, [settings?.theme]);
  useScrollTicks(settings?.scrollSound ?? true);
  async function updateSettings(patch: Partial<Settings>) {
    setSettings({ ...settings!, ...patch, ...(await window.api.setSettings(patch)) });
  }
  const [limit, setLimit] = useState(PAGE);
  const [opened, setOpened] = useState<string | null>(null);
  const [gCatalog, setGCatalog] = useState<GoogleEntry[] | null>(null);
  const [googleFiles, setGoogleFiles] = useState<Record<string, string[]>>({});
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [gCategory, setGCategory] = useState('all');
  const [gSort, setGSort] = useState<'popular' | 'az'>('popular');
  const [mode, setMode] = useState<'fonts' | 'icons'>('fonts');
  const icons = useIcons();

  // Velocidad de scroll: multiplicamos el desplazamiento de la rueda en las listas
  const scrollFactor = SCROLL_FACTOR[settings?.scrollSpeed ?? 'normal'];
  useEffect(() => {
    if (scrollFactor === 1) return;
    const onWheel = (e: WheelEvent) => {
      const list = (e.target as HTMLElement).closest?.('.list, .sidebar nav') as HTMLElement | null;
      if (!list || e.ctrlKey) return;
      e.preventDefault();
      list.scrollBy({ top: e.deltaY * scrollFactor, left: e.deltaX * scrollFactor });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [scrollFactor]);

  useEffect(() => {
    window.api.getSettings().then((s: Settings) => {
      setSettings(s);
      if (s.samples[0]) setText(s.samples[0]);
      setSize(s.size);
    });
    window.api.getLibrary().then((lib: any) => {
      setFonts(lib.fonts); setFolders(lib.folders); setFavorites(lib.favorites); setActive(new Set(lib.active));
      setGoogleFiles(lib.googleFiles ?? {});
      setLoading(false);
    });
    window.api.google.catalog().then(setGCatalog).catch(() => setGCatalog([]));
  }, []);

  const group = settings?.groupFamilies ?? true;
  const families = useMemo(() => {
    const map = new Map<string, Family>();
    for (const f of fonts) {
      // Sin agrupar, cada estilo aparece como una entrada propia
      const key = group ? f.family : `${f.family} ${f.style}`;
      let fam = map.get(key);
      if (!fam) map.set(key, fam = { name: key, files: [], formats: '', folders: new Set(), designer: '' });
      fam.files.push(f); fam.folders.add(f.folder);
      if (!fam.designer && f.designer) fam.designer = f.designer;
    }
    for (const fam of map.values()) fam.formats = [...new Set(fam.files.map((f) => f.format))].sort().join('/');
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [fonts, group]);

  const trees = useMemo(() => folders.map((root) => buildTree(root, fonts)), [folders, fonts]);

  // Familias de Google Fonts: cada estilo apunta a una vista previa remota ("gf:Familia:400")
  const googleFamilies = useMemo<Family[]>(() => (gCatalog ?? []).map((g) => ({
    name: g.family, provider: 'google', category: g.category, popularity: g.popularity,
    designer: g.designers.join(', '), formats: 'Google Fonts', folders: new Set(['google']),
    files: g.styles.map((st) => ({ file: `gf:${g.family}:${st}`, folder: 'google', format: 'Google', family: g.family, style: googleStyleName(st) })),
  })), [gCatalog]);

  const isActive = (fam: Family) => fam.provider === 'google'
    ? (googleFiles[fam.name] ?? []).some((f) => active.has(f))
    : fam.files.some((f) => active.has(f.file));
  const googleActive = googleFamilies.filter(isActive);
  const activeCount = families.filter(isActive).length + googleActive.length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (filter.kind === 'google') {
      const list = googleFamilies.filter((g) => (gCategory === 'all' || g.category === gCategory) && (!q || g.name.toLowerCase().includes(q)));
      return gSort === 'az' ? list : [...list].sort((a, b) => (a.popularity ?? 0) - (b.popularity ?? 0));
    }
    // Todas las vistas generales incluyen también las de proveedores; las carpetas, solo las locales
    const pool = filter.kind === 'folder' ? families : [...families, ...googleFamilies].sort((a, b) => a.name.localeCompare(b.name));
    return pool.filter((fam) => {
      if (q && !fam.name.toLowerCase().includes(q)) return false;
      switch (filter.kind) {
        case 'favorites': return favorites.includes(fam.name);
        case 'active': return isActive(fam);
        case 'inactive': return !isActive(fam);
        case 'folder': return fam.files.some((f) => inside(f.file, filter.folder));
        default: return true;
      }
    });
  }, [families, googleFamilies, query, filter, favorites, active, googleFiles, gCategory, gSort]);

  useEffect(() => { setLimit(PAGE); setOpened(null); }, [query, filter]);

  async function addFolder() {
    const r = await window.api.addFolder();
    if (!r) return;
    setFolders((fs) => (fs.includes(r.folder) ? fs : [...fs, r.folder]));
    setFonts((fs) => [...fs.filter((f) => f.folder !== r.folder), ...r.fonts]);
    setFilter({ kind: 'folder', folder: r.folder });
  }

  async function removeFolder(folder: string) {
    await window.api.removeFolder(folder);
    setFolders((fs) => fs.filter((f) => f !== folder));
    setFonts((fs) => fs.filter((f) => f.folder !== folder));
    setActive((a) => new Set([...a].filter((f) => !f.startsWith(folder))));
    if (filter.kind === 'folder' && (filter.folder === folder || inside(filter.folder, folder))) setFilter({ kind: 'all' });
  }

  async function toggle(fam: Family) {
    if (fam.provider === 'google') {
      // La primera activación descarga los .ttf; mientras tanto el punto muestra que está trabajando
      setDownloading((d) => new Set(d).add(fam.name));
      try {
        const r = await window.api.google.setActive(fam.name, !isActive(fam));
        setActive(new Set(r.active)); setGoogleFiles(r.googleFiles);
      } catch {} finally {
        setDownloading((d) => { const n = new Set(d); n.delete(fam.name); return n; });
      }
      return;
    }
    setActive(new Set(await window.api.setActive(fam.files.map((f) => f.file), !isActive(fam))));
  }

  async function toggleFavorite(name: string) {
    playFavoriteSound(!favorites.includes(name));
    setFavorites(await window.api.setFavorite(name, !favorites.includes(name)));
  }

  async function toggleFiles(files: string[], on: boolean) {
    setActive(new Set(await window.api.setActive(files, on)));
  }

  const openedFamily = opened ? (filter.kind === 'google' || !families.some((f) => f.name === opened)
    ? googleFamilies.find((f) => f.name === opened) ?? families.find((f) => f.name === opened)
    : families.find((f) => f.name === opened)) : undefined;

  const sel = (k: Filter['kind']) => filter.kind === k;

  return (
    <div className="shell">
      <GlobalTooltip />
      <ResizeHandles />
      <header className="topbar">
        <span className="brand">FontVault</span>
        <button className="topbar-btn" onClick={() => setSettingsOpen((o) => !o)} aria-pressed={settingsOpen} aria-label="Ajustes" data-tip="Ajustes"><IconGear /></button>
        <WindowControls />
      </header>

      <aside className="sidebar">
        <div className="mode-switch seg">
          <SegmentedControl label="Biblioteca" value={mode} onValueChange={(m) => { setMode(m as 'fonts' | 'icons'); setSettingsOpen(false); }}
            options={[{ value: 'fonts', label: 'Fuentes', accessory: <TextFont16Regular className="seg-ico" /> },
              { value: 'icons', label: 'Iconos', accessory: <Shapes16Regular className="seg-ico" /> }]} />
        </div>
        {mode === 'icons' ? <IconsSidebar state={icons} /> : (<>
        <div className="sidebar-search">
          <SearchField label="Buscar fuentes" placeholder="Buscar fuentes…" value={query} onValueChange={setQuery} />
        </div>
        <nav>
          <NavItem label="Todas" icon={<TextFont16Regular />} count={families.length + googleFamilies.length} selected={sel('all')} onClick={() => setFilter({ kind: 'all' })} />
          <NavItem label="Favoritas" icon={<Heart16Regular />} count={favorites.length} selected={sel('favorites')} onClick={() => setFilter({ kind: 'favorites' })} />
          <NavItem label="Activas" icon={<CheckmarkCircle16Regular />} tone="green" count={activeCount} selected={sel('active')} onClick={() => setFilter({ kind: 'active' })} />
          <NavItem label="Inactivas" icon={<Circle16Regular />} count={families.length + googleFamilies.length - activeCount} selected={sel('inactive')} onClick={() => setFilter({ kind: 'inactive' })} />

          <h2>Proveedores</h2>
          <NavItem label="Google Fonts" icon={<Globe16Regular />} count={gCatalog?.length} selected={sel('google')} onClick={() => setFilter({ kind: 'google' })} />

          <h2>Carpetas</h2>
          {folders.length === 0 && <p className="nav-empty">Sin carpetas todavía</p>}
          {trees.map((tree) => (
            <FolderTree key={tree.path} node={tree} depth={0}
              selected={filter.kind === 'folder' ? filter.folder : null}
              onSelect={(folder) => setFilter({ kind: 'folder', folder })} onRemove={() => removeFolder(tree.path)} />
          ))}
        </nav>
        <div className="sidebar-foot">
          <Button variant="secondary" size="sm" onClick={addFolder}>Añadir carpeta</Button>
        </div>
        </>)}
      </aside>

      <main className="content">
        {mode === 'icons' && !settingsOpen ? <IconsMain state={icons} /> : (<>
        {settingsOpen && settings && (
          <SettingsPage settings={settings} onChange={updateSettings} folders={folders}
            onAddFolder={addFolder} onRemoveFolder={removeFolder} onClose={() => setSettingsOpen(false)} />
        )}
        <div className="toolbar" hidden={settingsOpen}>
          <span className="toolbar-label" aria-hidden="true">Tamaño</span>
          <div className="toolbar-slider">
            <Slider label="Tamaño" value={size} onValueChange={(v) => { if (v !== size) playTick(); setSize(v); }} min={12} max={160} format={(v) => `${v}px`} showValue={false} />
          </div>
          <span className="toolbar-value">{size}px</span>
          <Button variant="secondary" size="sm" className="icon-only" onClick={() => { setSize(settings?.size ?? 42); setText(settings?.samples[0] || DEFAULT_TEXT); }} aria-label="Restablecer"><IconReset /></Button>
        </div>

        {openedFamily && !settingsOpen && (
          <div className="list">
            <FamilyDetail family={openedFamily} active={active} text={text} size={size}
              onBack={() => setOpened(null)} onToggleFiles={toggleFiles}
              isFavorite={favorites.includes(openedFamily.name)} onFavorite={() => toggleFavorite(openedFamily.name)}
              familyActive={isActive(openedFamily)} busy={downloading.has(openedFamily.name)} onToggleFamily={() => toggle(openedFamily)} />
          </div>
        )}

        {/* La lista se oculta en lugar de desmontarse para conservar el scroll */}
        <div className="list" hidden={!!openedFamily || settingsOpen}>
          {filter.kind === 'google' && (
            <div className="collections-head provider-head">
              <div className="setting-select wide">
                <Select label="Categoría" value={gCategory} onValueChange={setGCategory}
                  options={[{ value: 'all', label: 'Todas las categorías' }, ...Object.entries(GOOGLE_CATEGORIES).map(([value, label]) => ({ value, label }))]} />
              </div>
              <div className="setting-select">
                <Select label="Orden" value={gSort} onValueChange={(v) => setGSort(v as 'popular' | 'az')}
                  options={[{ value: 'popular', label: 'Más populares' }, { value: 'az', label: 'A–Z' }]} />
              </div>
              <span className="muted-count">{visible.length.toLocaleString('es')} familias</span>
            </div>
          )}
          {filter.kind === 'google' ? (
            gCatalog === null ? <p className="empty">Cargando Google Fonts…</p>
            : gCatalog.length === 0 ? <p className="empty">No se pudo cargar Google Fonts. Revisa tu conexión a internet.</p>
            : visible.slice(0, limit).map((fam) => (
              <FamilyRow key={fam.name} family={fam} isActive={isActive(fam)} busy={downloading.has(fam.name)} text={text} size={size}
                onToggle={() => toggle(fam)} onOpen={() => setOpened(fam.name)} />
            ))
          ) : loading ? <p className="empty">Cargando biblioteca…</p>
            : folders.length === 0 && filter.kind === 'folder' ? (
              <div className="empty">
                <p>Añade una carpeta con fuentes para empezar.</p>
                <Button size="sm" onClick={addFolder}>Añadir carpeta</Button>
              </div>
            ) : visible.length === 0 ? <p className="empty">Ninguna fuente coincide.</p>
            : visible.slice(0, limit).map((fam) => (
              <FamilyRow key={(fam.provider ?? 'local') + fam.name} family={fam} isActive={isActive(fam)} busy={downloading.has(fam.name)} showSource={filter.kind !== 'folder'} text={text} size={size} onToggle={() => toggle(fam)} onOpen={() => setOpened(fam.name)} />
            ))}
          {visible.length > limit && (
            <LoadMore onVisible={() => setLimit((l) => l + PAGE)} />
          )}
        </div>

        <div className="sample-bar" hidden={settingsOpen}>
          <Input label="Texto de ejemplo" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un texto de ejemplo" />
          <SamplePicker samples={settings?.samples ?? [DEFAULT_TEXT]} current={text} onPick={setText} />
        </div>
        </>)}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
