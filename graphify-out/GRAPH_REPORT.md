# Graph Report - Fontvault  (2026-10-28)

## Corpus Check
- Corpus is ~25,328 words - fits in a single context window. You may not need a graph.

## Summary
- 440 nodes · 752 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.84)
- Token cost: 128,106 input · 0 output

## Community Hubs (Navigation)
- Interfaz principal de fuentes
- Menú contextual y dependencias UI
- Deslizador de tamaño
- Vista de iconos y color
- Proceso principal e Iconify
- Dependencias del paquete
- Proveedores de fuentes en línea
- Conceptos del README
- Configuración de componentes
- Configuración del instalador
- Botón de Arc UI
- Captura de la app
- Activación nativa en Windows
- Configuración de TypeScript
- Campo de texto de Arc UI
- Traducción de búsquedas
- Lógica del menú contextual
- Patrocinio
- Estilos compilados

## God Nodes (most connected - your core abstractions)
1. `App()` - 35 edges
2. `Slider()` - 20 edges
3. `CollectionView()` - 17 edges
4. `react` - 15 edges
5. `api()` - 12 edges
6. `SearchResults()` - 12 edges
7. `motion` - 11 edges
8. `FamilyDetail()` - 11 edges
9. `Button` - 11 edges
10. `motionTokens` - 11 edges

## Surprising Connections (you probably didn't know these)
- `dist/app.js bundle` --implements--> `FontVault`  [INFERRED]
  index.html → README.md
- `Content-Security-Policy` --conceptually_related_to--> `Iconify`  [INFERRED]
  index.html → README.md
- `FamilyDetail()` --calls--> `Button`  [EXTRACTED]
  src/app.tsx → src/components/arc/button/button.tsx
- `FamilyDetail()` --calls--> `Select`  [EXTRACTED]
  src/app.tsx → src/components/arc/select/select.tsx
- `FamilyDetail()` --calls--> `IconBack()`  [EXTRACTED]
  src/app.tsx → src/shared.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Catálogos de fuentes en línea** — readme_google_fonts, readme_fontshare, readme_fontsource, readme_font_providers [EXTRACTED 1.00]
- **Flujo de iconos Iconify** — readme_iconify, readme_icon_search_translation, readme_icon_drag_drop, readme_icon_libraries [INFERRED 0.85]
- **Preview controls shaping font samples** — docs_screenshot_size_slider, docs_screenshot_preview_text_input, docs_screenshot_font_preview_list [INFERRED 0.85]

## Communities (19 total, 2 thin omitted)

### Community 0 - "Interfaz principal de fuentes"
Cohesion: 0.05
Nodes (61): App(), removeFolder(), toggleFavorite(), buildTree(), CatalogEntry, CATEGORIES, Details(), Family (+53 more)

### Community 1 - "Menú contextual y dependencias UI"
Cohesion: 0.07
Nodes (28): lucide-react@^1.61.0, motion@^14.6.0, lucide-react, motion, react, contextMenuExampleItems, ContextMenuItem, ContextMenuProps (+20 more)

### Community 2 - "Deslizador de tamaño"
Cohesion: 0.08
Nodes (39): bubbleEnter, bubbleIn, bubbleOut, bubbleRest, clamp(), decimalsOf(), DIGITS, Drag (+31 more)

### Community 3 - "Vista de iconos y color"
Cohesion: 0.11
Nodes (39): ColorButton(), hexToHsv(), Hsv, hsvToHex(), useDrag(), Select, api(), buildSvg() (+31 more)

### Community 4 - "Proceso principal e Iconify"
Cohesion: 0.07
Nodes (27): cache, DIR, DRAG_DIR, getJSON(), limited(), queue, active, APP_ICON (+19 more)

### Community 5 - "Dependencias del paquete"
Cohesion: 0.07
Nodes (33): author, dependencies, koffi@^3.3.3, opentype.js@^2.0.0, description, devDependencies, electron@^45.0.0, electron-builder@^26.15.3 (+25 more)

### Community 6 - "Proveedores de fuentes en línea"
Cohesion: 0.09
Nodes (25): catalogs, download(), existing(), fetchBuffer(), fetchOk(), fontshare, fontsource, fontsourceInfo (+17 more)

### Community 7 - "Conceptos del README"
Cohesion: 0.08
Nodes (20): Content-Security-Policy, dist/app.js bundle, #root mount point, Agrupación por familia, Detalle de familia (Estilos, Cascada, Glifos, Detalles), Proveedores de fuentes, Fontshare, Fontsource (+12 more)

### Community 8 - "Configuración de componentes"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, registries, @uiarc (+9 more)

### Community 9 - "Configuración del instalador"
Cohesion: 0.11
Nodes (18): build, appId, asarUnpack, directories, files, nsis, productName, win (+10 more)

### Community 10 - "Botón de Arc UI"
Cohesion: 0.13
Nodes (16): Button, ButtonProps, ButtonSize, ButtonVariant, fadeIn, fadeOut, iconEnter, iconIn (+8 more)

### Community 11 - "Captura de la app"
Cohesion: 0.19
Nodes (14): FontVault App Screenshot, Category and Popularity Sort Filters, Category Folders (Display/Sans Serif/Script/Serif), Font Preview List, Font Search, Fuentes / Iconos Tabs, Fontshare, Fontsource (+6 more)

### Community 12 - "Activación nativa en Windows"
Cohesion: 0.26
Nodes (11): activate(), AddFontResourceW, deactivate(), dwmapi, DwmSetWindowAttribute, gdi32, notify(), PostMessageW (+3 more)

### Community 13 - "Configuración de TypeScript"
Cohesion: 0.18
Nodes (10): compilerOptions, baseUrl, jsx, module, moduleResolution, paths, skipLibCheck, strict (+2 more)

### Community 14 - "Campo de texto de Arc UI"
Cohesion: 0.31
Nodes (8): digit, FieldMessage(), Input, InputProps, isNumber(), MessageRow(), MotionText(), RollingNumber()

### Community 15 - "Traducción de búsquedas"
Cohesion: 0.32
Nodes (4): DICT, normalize(), STOP, translateQuery()

### Community 16 - "Lógica del menú contextual"
Cohesion: 0.39
Nodes (7): clampTo(), ContextMenu(), onMenuFocus(), onTargetClick(), onTargetKeyDown(), place(), showMenu()

## Knowledge Gaps
- **20 isolated node(s):** `Agrupación por familia`, `Detalle de familia (Estilos, Cascada, Glifos, Detalles)`, `Google Fonts`, `Fontshare`, `Fontsource` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 213 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `Dependencias del paquete` to `Proceso principal e Iconify`, `Proveedores de fuentes en línea`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **What connects `Agrupación por familia`, `Detalle de familia (Estilos, Cascada, Glifos, Detalles)`, `Google Fonts` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Interfaz principal de fuentes` be split into smaller, more focused modules?**
  _Cohesion score 0.05443371378402107 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Menú contextual y dependencias UI` to `Interfaz principal de fuentes`, `Deslizador de tamaño`, `Vista de iconos y color`, `Dependencias del paquete`, `Botón de Arc UI`, `Campo de texto de Arc UI`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Should `Menú contextual y dependencias UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07200929152148665 - nodes in this community are weakly interconnected._
- **Why does `motion` connect `Menú contextual y dependencias UI` to `Botón de Arc UI`, `Deslizador de tamaño`, `Dependencias del paquete`, `Campo de texto de Arc UI`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `Deslizador de tamaño` be split into smaller, more focused modules?**
  _Cohesion score 0.07897793263646923 - nodes in this community are weakly interconnected._