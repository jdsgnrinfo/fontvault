import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchField } from '@/components/arc/search-field/search-field';
import { Slider } from '@/components/arc/slider/slider';
import { Button } from '@/components/arc/button/button';
import { Select } from '@/components/arc/select/select';
import { Input } from '@/components/arc/input/input';
import { ColorButton } from './color';
import { translateQuery } from './es-en';
import { Code16Regular, Copy16Regular, ArrowDownload16Regular, CompassNorthwest16Regular, Library16Regular, Heart16Regular } from '@fluentui/react-icons';
import { Progress } from '@/components/arc/progress/progress';
import { ContextMenu, type ContextMenuItem } from '@/components/arc/context-menu/context-menu';
import { IconBack, IconHeart, NavItem, VirtualGrid, playFavoriteSound, playTick } from './shared';


type Info = {
  name: string; total?: number; category?: string; palette?: boolean; height?: number; samples?: string[];
  author?: { name: string; url?: string }; license?: { title: string; spdx?: string; url?: string };
};
type Library = { prefix: string; info: Info; count: number };
type IconData = { body: string; width?: number; height?: number };
type IconSet = { prefix: string; info?: Info; icons: Record<string, IconData>; width: number; height: number; categories?: Record<string, string[]> };
type View = { kind: 'explore' } | { kind: 'collection'; prefix: string } | { kind: 'favorites' };
type Selected = { prefix: string; name: string };

const api = () => (window as any).api.icons;

// Color de tinta para pintar los iconos según el tema (claro u oscuro)
const ink = () => (document.documentElement.dataset.theme === 'dark' ? '#e4e4e4' : '#262626');

function buildSvg(set: IconSet, name: string, color = 'currentColor') {
  const icon = set.icons[name];
  if (!icon) return '';
  const w = icon.width ?? set.width, h = icon.height ?? set.height;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${icon.body.replace(/currentColor/g, color)}</svg>`;
}

// Los iconos se insertan como SVG en línea y no como imágenes data:, porque Chromium guarda en caché cada
// imagen data: distinta y al recorrer colecciones grandes la interfaz llegaba a casi 2 GB.
// Antes de insertarlos se quitan scripts y atributos de eventos por seguridad.
const clean = (svg: string) => svg.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '');
const iconSrc = (set: IconSet | null | undefined, name: string, color: string) =>
  set?.icons[name] ? clean(buildSvg(set, name, color)) : '';
const SvgIcon = ({ markup }: { markup: string }) => <span className="svg-icon" dangerouslySetInnerHTML={{ __html: markup }} />;

// Almacén de iconos remotos: se piden por lotes al proceso principal (nunca uno por uno,
// porque Iconify limita el número de peticiones) y se comparten entre todas las vistas
const remote = new Map<string, IconSet>();
const MAX_REMOTE_ICONS = 8000;
const pending = new Set<string>();
const listeners = new Set<() => void>();

function requestIcons(prefix: string, names: string[]) {
  const missing = names.filter((n) => !remote.get(prefix)?.icons[n] && !pending.has(prefix + ':' + n));
  if (missing.length === 0) return;
  missing.forEach((n) => pending.add(prefix + ':' + n));
  api().data(prefix, missing).then((d: IconSet) => {
    const cur = remote.get(prefix) ?? { prefix, icons: {}, width: d.width, height: d.height };
    Object.assign(cur.icons, d.icons);
    cur.width = d.width; cur.height = d.height;
    remote.delete(prefix); remote.set(prefix, cur);
    // Límite por número de iconos (no por colecciones): así las muestras de las 243 tarjetas, que son pocas
    // por colección, caben todas y no desaparecen al volver arriba. Se descartan las colecciones usadas hace más tiempo
    let total = 0;
    for (const set of remote.values()) total += Object.keys(set.icons).length;
    for (const [p, set] of remote) {
      if (total <= MAX_REMOTE_ICONS || p === prefix) break;
      total -= Object.keys(set.icons).length;
      remote.delete(p);
    }
    listeners.forEach((l) => l());
  }).catch(() => {}).finally(() => missing.forEach((n) => pending.delete(prefix + ':' + n)));
}


function useRemote() {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return remote;
}

export function useIcons() {
  const [view, setView] = useState<View>({ kind: 'explore' });
  const [query, setQuery] = useState('');
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [progress, setProgress] = useState<Record<string, [number, number]>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const refresh = () => api().libraries().then(setLibraries);

  useEffect(() => { refresh(); api().favorites().then(setFavorites); }, []);

  async function toggleFavorite(prefix: string) {
    playFavoriteSound(!favorites.includes(prefix));
    setFavorites(await api().setFavorite(prefix, !favorites.includes(prefix)));
  }
  useEffect(() => api().onProgress((prefix: string, done: number, total: number) =>
    setProgress((p) => ({ ...p, [prefix]: [done, total] }))), []);

  async function download(prefix: string) {
    setProgress((p) => ({ ...p, [prefix]: [0, 1] }));
    try { await api().download(prefix); await refresh(); }
    finally { setProgress((p) => { const { [prefix]: _, ...rest } = p; return rest; }); }
  }

  async function remove(prefix: string) {
    await api().remove(prefix);
    await refresh();
  }

  return { view, setView, query, setQuery, libraries, progress, download, remove, favorites, toggleFavorite };
}

type IconsState = ReturnType<typeof useIcons>;

export function IconsSidebar({ state }: { state: IconsState }) {
  const { view, setView, query, setQuery, libraries, remove, favorites } = state;
  return (
    <>
      <div className="sidebar-search">
        <SearchField label="Buscar iconos" placeholder="Buscar iconos…" value={query}
          onValueChange={(q) => { setQuery(q); setView({ kind: 'explore' }); }} />
      </div>
      <nav>
        <NavItem label="Explorar colecciones" icon={<CompassNorthwest16Regular />} selected={view.kind === 'explore'} onClick={() => { setQuery(''); setView({ kind: 'explore' }); }} />
        <NavItem label="Favoritos" icon={<Heart16Regular />} count={favorites.length}
          selected={view.kind === 'favorites'} onClick={() => { setQuery(''); setView({ kind: 'favorites' }); }} />
        <h2>Mis bibliotecas</h2>
        {libraries.length === 0 && <p className="nav-empty">Descarga una colección para tenerla sin conexión</p>}
        {libraries.map((l) => (
          <NavItem key={l.prefix} label={l.info?.name ?? l.prefix} count={l.count} icon={<Library16Regular />}
            selected={view.kind === 'collection' && view.prefix === l.prefix}
            onClick={() => setView({ kind: 'collection', prefix: l.prefix })} onRemove={() => remove(l.prefix)} />
        ))}
      </nav>
    </>
  );
}

// Algunos programas (como Illustrator) no entienden currentColor: en archivos usamos negro
const fileColor = (c: string) => (c === 'currentColor' ? '#000000' : c);

// Arrastrar un icono lo entrega como archivo .svg a cualquier programa que acepte SVG
function dragIcon(e: React.DragEvent, name: string, svg: string) {
  e.preventDefault();
  if (svg) api().startDrag(name, svg);
}

function IconCell({ src, label, full, selected, svg, caption }: {
  src: string; label: string; full: string; selected: boolean; svg: () => string; caption?: [string, string];
}) {
  return (
    // Un div en lugar de <button>: Chromium no siempre inicia el arrastre desde botones
    <div tabIndex={0} data-icon={full} className={'icon-cell' + (selected ? ' selected' : '')}
      data-tip={label + ' · arrastra para usarlo, clic derecho para más opciones'} aria-label={label}
      draggable={!!src} onDragStart={(e) => dragIcon(e, label.replace(':', '-'), svg())}>
      {src ? <SvgIcon markup={src} /> : <span className="icon-skeleton" />}
      {caption && <span className="icon-caption"><b>{caption[0]}</b><i>{caption[1]}</i></span>}
    </div>
  );
}

// Menú contextual de un icono: las mismas acciones que tenía el panel lateral
function useIconMenu(target: Selected | null, local: IconSet | null, color: string, openLibrary?: (prefix: string) => void): ContextMenuItem[] {
  const store = useRemote();
  if (!target) return [];
  const full = `${target.prefix}:${target.name}`;
  const set = (local?.prefix === target.prefix ? local : null) ?? store.get(target.prefix) ?? null;
  const copy = (text: string) => text && navigator.clipboard.writeText(text);
  return [
    { id: 'svg', label: 'Copiar SVG', icon: <Code16Regular />, disabled: !set, onSelect: () => copy(set ? buildSvg(set, target.name, color) : '') },
    { id: 'name', label: 'Copiar nombre', icon: <Copy16Regular />, onSelect: () => copy(full) },
    { id: 'save', label: 'Guardar como .svg…', icon: <ArrowDownload16Regular />, disabled: !set, onSelect: () => set && api().saveSvg(target.name, buildSvg(set, target.name, fileColor(color))) },
    // En la búsqueda general, permite ir a la biblioteca de la que viene el icono
    ...(openLibrary ? [{ id: 'library', label: 'Biblioteca completa', icon: <Library16Regular />, onSelect: () => openLibrary(target.prefix) }] : []),
  ];
}

// Bibliotecas marcadas como favoritas, como tarjetas
function FavoritesView({ state }: { state: IconsState }) {
  const [all, setAll] = useState<Record<string, Info> | null>(null);
  useEffect(() => { api().collections().then(setAll).catch(() => setAll({})); }, []);
  const owned = new Set(state.libraries.map((l) => l.prefix));
  const info = (p: string) => all?.[p] ?? state.libraries.find((l) => l.prefix === p)?.info ?? { name: p };
  return (
    <div className="collection-view">
      <div className="detail-head">
        <div className="detail-title">
          <h1>Favoritos</h1>
          <span>{state.favorites.length} {state.favorites.length === 1 ? 'biblioteca' : 'bibliotecas'}</span>
        </div>
      </div>
      {state.favorites.length === 0 ? <p className="empty">Abre una colección y pulsa el corazón junto a su nombre para añadirla aquí.</p> : (
        <div className="collection-grid">
          {state.favorites.map((p) => (
            <CollectionCard key={p} prefix={p} info={info(p)} owned={owned.has(p)} onOpen={() => state.setView({ kind: 'collection', prefix: p })} />
          ))}
        </div>
      )}
    </div>
  );
}

function Toolbar({ size, setSize, color, setColor }: { size: number; setSize: (n: number) => void; color: string; setColor: (c: string) => void }) {
  const mono = color !== 'currentColor';
  return (
    <div className="toolbar">
      <span className="toolbar-label" aria-hidden="true">Tamaño</span>
          <div className="toolbar-slider">
        <Slider label="Tamaño" value={size} onValueChange={(v) => { if (v !== size) playTick(); setSize(v); }} min={16} max={96} format={(v) => `${v}px`} showValue={false} />
      </div>
          <span className="toolbar-value">{size}px</span>
      <div className="color-pick">
        <ColorButton label="Color de los iconos" value={mono ? color : ink()} onChange={setColor} />
      </div>
      {mono && <Button variant="secondary" size="sm" onClick={() => setColor('currentColor')}>Color original</Button>}
    </div>
  );
}

// Las muestras se piden solo cuando la tarjeta aparece en pantalla
function CollectionCard({ prefix, info: c, owned, onOpen }: { prefix: string; info: Info; owned: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const store = useRemote();
  const samples = (c.samples ?? []).slice(0, 3);
  useEffect(() => {
    // Cada vez que la tarjeta vuelve a verse se piden las muestras que falten (si ya están, no hace nada)
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) requestIcons(prefix, samples);
    }, { rootMargin: '200px' });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [prefix]);
  const set = store.get(prefix);
  return (
    <button ref={ref} className="collection-card" onClick={onOpen}>
      <div className="collection-samples">
        {samples.map((n) => { const src = iconSrc(set, n, ink()); return src ? <SvgIcon key={n} markup={src} /> : <span key={n} className="icon-skeleton" />; })}
      </div>
      <strong>{c.name}</strong>
      <span>{c.total?.toLocaleString('es')} iconos · {c.license?.title ?? 'Licencia desconocida'}</span>
      <span className="author">{c.author?.name}{owned ? ' · Descargada' : ''}</span>
    </button>
  );
}

function Collections({ onOpen, libraries, query, children }: {
  onOpen: (prefix: string) => void; libraries: Library[]; query: string; children?: React.ReactNode;
}) {
  const [all, setAll] = useState<Record<string, Info> | null>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => { api().collections().then(setAll).catch(() => setError('No se pudo conectar con Iconify. Revisa tu conexión a internet.')); }, []);

  const categories = useMemo(() => [...new Set(Object.values(all ?? {}).map((c) => c.category || 'Otras'))].sort(), [all]);
  const list = useMemo(() => Object.entries(all ?? {})
    .filter(([, c]) => category === 'all' || (c.category || 'Otras') === category)
    .sort((a, b) => (b[1].total ?? 0) - (a[1].total ?? 0)), [all, category]);

  const owned = new Set(libraries.map((l) => l.prefix));
  const searching = query.trim() !== '';

  return (
    <div className="collections">
      {/* La búsqueda se hace desde la barra lateral; aquí solo el filtro de categoría y el total */}
      {!searching && all && (
        <div className="collections-head">
          <div className="setting-select wide">
            <Select label="Categoría" value={category} onValueChange={setCategory}
              options={[{ value: 'all', label: 'Todas las categorías' }, ...categories.map((c) => ({ value: c, label: c }))]} />
          </div>
          <span className="muted-count push-right">{list.length} colecciones</span>
        </div>
      )}
      {searching ? children : error ? <p className="empty">{error}</p> : !all ? <p className="empty">Cargando colecciones…</p> : (
      <div className="collection-grid">
        {list.map(([prefix, c]) => (
          <CollectionCard key={prefix} prefix={prefix} info={c} owned={owned.has(prefix)} onOpen={() => onOpen(prefix)} />
        ))}
      </div>
      )}
    </div>
  );
}

function SearchResults({ query, color, sel, setSel, size }: { query: string; color: string; sel: Selected | null; setSel: (s: Selected) => void; size: number }) {
  const store = useRemote();
  const [icons, setIcons] = useState<string[] | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [names, setNames] = useState<Record<string, Info>>({});
  useEffect(() => { api().collections().then(setNames).catch(() => {}); }, []);

  useEffect(() => {
    setIcons(null);
    // Esperamos a que deje de escribir antes de consultar la API
    // Si se escribe en español, buscamos también la traducción y mezclamos (primero los resultados traducidos)
    const t = setTimeout(async () => {
      const en = translateQuery(query);
      const lists = await Promise.all([en, query].filter(Boolean).map((q) => api().search(q).catch(() => [] as string[])));
      setIcons([...new Set(lists.flat() as string[])]);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Pedimos los iconos visibles agrupados por colección: un lote por colección
  useEffect(() => {
    const groups = new Map<string, string[]>();
    for (const full of (icons ?? []).slice(range[0], range[1])) {
      const [prefix, name] = full.split(':');
      groups.set(prefix, [...(groups.get(prefix) ?? []), name]);
    }
    groups.forEach((names, prefix) => requestIcons(prefix, names));
  }, [icons, range[0], range[1]]);

  if (!icons) return <p className="empty">Buscando…</p>;
  if (icons.length === 0) return <p className="empty">No se encontraron iconos.</p>;
  const shown = color === 'currentColor' ? ink() : color;
  return (
    <>
      <p className="muted-count block">{icons.length >= 999 ? 'Más de 999' : icons.length} resultados para “{query}”{translateQuery(query) && <> · buscando también “{translateQuery(query)}”</>}</p>
      <VirtualGrid className="icon-vgrid labeled" count={icons.length} minCell={Math.max(132, size + 72)} gap={8} cellHeight={size + 74}
        onRange={(a, b) => setRange([a, b])} render={(i) => {
          const full = icons[i];
          const [prefix, name] = full.split(':');
          const set = store.get(prefix);
          return <IconCell src={iconSrc(set, name, shown)} label={full} svg={() => (set ? buildSvg(set, name, fileColor(color)) : '')}
            selected={sel?.prefix === prefix && sel?.name === name} full={full} caption={[name, names[prefix]?.name ?? prefix]} />;
        }} />
    </>
  );
}

function CollectionView({ prefix, state, color, sel, setSel, setLocal, size }: {
  prefix: string; state: IconsState; color: string; sel: Selected | null; setSel: (s: Selected) => void; setLocal: (s: IconSet | null) => void; size: number;
}) {
  const store = useRemote();
  const lib = state.libraries.find((l) => l.prefix === prefix);
  const [local, setLocalSet] = useState<IconSet | null>(null);
  const [list, setList] = useState<{ title: string; total: number; names: string[]; categories: Record<string, string[]> } | null>(null);
  const [info, setInfo] = useState<Info | null>(lib?.info ?? null);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('all');
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalSet(null); setList(null); setFilter(''); setCategory('all'); setError('');
    if (lib) api().load(prefix).then((s: IconSet) => { setLocalSet(s); setInfo(s.info ?? null); });
    else {
      api().collection(prefix).then(setList).catch(() => setError('No se pudo cargar la colección.'));
      api().collections().then((all: Record<string, Info>) => setInfo(all[prefix] ?? null)).catch(() => {});
    }
  }, [prefix, !!lib]);

  useEffect(() => { setLocal(local); }, [local]);

  const categories = local?.categories ?? list?.categories ?? {};
  const names = useMemo(() => {
    const base = category !== 'all' ? categories[category] ?? [] : local ? Object.keys(local.icons) : list?.names ?? [];
    const q = filter.trim().toLowerCase();
    return q ? base.filter((n) => n.includes(q)) : base;
  }, [local, list, filter, category]);
  const visible = useMemo(() => names.slice(range[0], range[1]), [names, range[0], range[1]]);

  // Sin descargar, pedimos solo la página visible en un único lote
  useEffect(() => { if (!local && list) requestIcons(prefix, visible); }, [visible, !!local, !!list]);

  const busy = state.progress[prefix];
  const shown = color === 'currentColor' ? ink() : color;
  const set = local ?? store.get(prefix);

  return (
    <div className="collection-view">
      <div className="detail-head">
        <Button variant="secondary" size="sm" className="icon-only" onClick={() => state.setView({ kind: 'explore' })} aria-label="Volver" data-tip="Volver"><IconBack /></Button>
        <div className="detail-title">
          <div className="detail-name">
            <h1>{info?.name ?? list?.title ?? prefix}</h1>
            <button className={'fav' + (state.favorites.includes(prefix) ? ' on' : '')} onClick={() => state.toggleFavorite(prefix)}
              aria-pressed={state.favorites.includes(prefix)} aria-label={state.favorites.includes(prefix) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              data-tip={state.favorites.includes(prefix) ? 'Quitar de favoritos' : 'Añadir a favoritos'}><IconHeart /></button>
          </div>
          <span>
            {(local ? Object.keys(local.icons).length : list?.total ?? info?.total ?? 0).toLocaleString('es')} iconos
            {info?.license && <> · {info.license.url ? <a href={info.license.url} target="_blank" rel="noreferrer">{info.license.title}</a> : info.license.title}</>}
            {info?.author && <> · {info.author.name}</>}
          </span>
        </div>
        {lib ? (
          <Button variant="secondary" size="sm" onClick={() => state.remove(prefix)}>Eliminar de mis bibliotecas</Button>
        ) : busy ? (
          <div className="download-progress">
            <Progress label="Descargando" value={busy[0]} max={busy[1]} showValue />
          </div>
        ) : (
          <Button size="sm" onClick={() => state.download(prefix)}>Descargar biblioteca</Button>
        )}
      </div>

      <div className="collections-head">
        <div className="collections-filter">
          <Input label="Filtrar iconos" placeholder="Filtrar iconos de esta colección…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        {Object.keys(categories).length > 0 && (
          <div className="setting-select wide">
            <Select label="Categoría" value={category} onValueChange={setCategory}
              options={[{ value: 'all', label: 'Todas las categorías' }, ...Object.keys(categories).sort().map((c) => ({ value: c, label: c }))]} />
          </div>
        )}
        <span className="muted-count">{names.length.toLocaleString('es')} iconos</span>
      </div>

      {error ? <p className="empty">{error}</p> : !local && !list ? <p className="empty">Cargando iconos…</p> : (
        <>
          <VirtualGrid key={filter + category} className="icon-vgrid" count={names.length} minCell={size + 36} gap={4}
            onRange={(a, b) => setRange([a, b])} render={(i) => {
              const n = names[i];
              return <IconCell src={iconSrc(set, n, shown)} label={n} svg={() => (set ? buildSvg(set, n, fileColor(color)) : '')} selected={sel?.prefix === prefix && sel?.name === n} full={`${prefix}:${n}`} />;
            }} />
        </>
      )}
    </div>
  );
}

export function IconsMain({ state }: { state: IconsState }) {
  const [size, setSize] = useState(32);
  const [color, setColor] = useState('currentColor');
  const [sel, setSel] = useState<Selected | null>(null);
  const [local, setLocal] = useState<IconSet | null>(null);
  const { view, query } = state;

  const searching = view.kind === 'explore' && query.trim() !== '';
  const menu = useIconMenu(sel, local, color, searching ? (prefix) => state.setView({ kind: 'collection', prefix }) : undefined);

  useEffect(() => { setSel(null); setLocal(null); }, [view, query]);

  return (
    <>
      <Toolbar size={size} setSize={setSize} color={color} setColor={setColor} />
      <div className="icons-body" style={{ ['--icon-size' as any]: `${size}px` }}>
        <div className="list" onContextMenuCapture={(e) => {
          // Solo abrimos el menú sobre un icono; el resto de la lista no tiene menú
          const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-icon]');
          if (!cell) { e.stopPropagation(); return; }
          const [prefix, name] = cell.dataset.icon!.split(':');
          setSel({ prefix, name });
        }}>
          <ContextMenu items={menu} label="Opciones del icono">
          {/* El menú de Arc también se abre con clic izquierdo: lo frenamos para que solo responda al derecho */}
          <div onClick={(e) => e.stopPropagation()}>
          {view.kind === 'favorites' ? (
            <FavoritesView state={state} />
          ) : view.kind === 'collection' ? (
            <CollectionView prefix={view.prefix} state={state} color={color} sel={sel} setSel={setSel} setLocal={setLocal} size={size} />
          ) : (
            <Collections libraries={state.libraries} query={query}
              onOpen={(prefix) => state.setView({ kind: 'collection', prefix })}>
              {query.trim() && <SearchResults query={query.trim()} color={color} sel={sel} setSel={setSel} size={size} />}
            </Collections>
          )}
          </div>
          </ContextMenu>
        </div>
      </div>
    </>
  );
}
