<p align="center">
  <img src="build/icon.png" width="96" alt="FontVault">
</p>

<h1 align="center">FontVault</h1>

<p align="center">Gestor de fuentes e iconos para diseñadores, para Windows.</p>

![FontVault](docs/screenshot.webp)

FontVault reúne en un solo lugar tus fuentes locales, los catálogos de fuentes libres más usados y más de 200 colecciones de iconos. Puedes previsualizarlo todo con tu propio texto, activar fuentes en Windows sin instalarlas y llevar iconos a tus programas de diseño con solo arrastrarlos.

## Fuentes

### Biblioteca local
- **Tus carpetas, tal cual:** añade carpetas desde Ajustes y FontVault respeta su organización con subcarpetas. Los archivos no se copian ni se mueven.
- **Formatos:** TTF, OTF, TTC, WOFF y WOFF2.
- **Agrupadas por familia:** cada familia aparece una vez con todos sus estilos. Se puede desactivar para ver cada estilo por separado.
- **Activar sin instalar:** un clic en el punto de cada familia la activa en Windows. Queda disponible en Photoshop, Illustrator, Figma, Office y cualquier otra aplicación, sin tocar `C:\Windows\Fonts`.
- **Se recuerdan:** las fuentes activas se liberan al cerrar la app y se reactivan al volver a abrirla (opcional).

### Vista previa
- Texto y tamaño editables, con textos de ejemplo predefinidos que puedes personalizar en Ajustes.
- Buscador, favoritas y filtros por activas, inactivas o carpeta.

### Detalle de cada familia
- **Estilos:** todos los pesos y cursivas, ordenados de Thin a Black, con activación por estilo.
- **Cascada:** la misma fuente de 72 a 12 px para valorar su legibilidad.
- **Glifos:** todos los caracteres que contiene la fuente, con su código Unicode.
- **Detalles:** copyright, diseñador, licencia, versión, nombre PostScript y funciones OpenType (ligaduras, versalitas, cifras, conjuntos estilísticos…).

## Proveedores de fuentes

Catálogos en línea que se ven y se activan igual que tus fuentes locales. La primera vez que activas una familia, FontVault descarga sus archivos a tu equipo; después funciona sin conexión.

| Proveedor | Familias | Qué ofrece |
|---|---|---|
| **Google Fonts** | ~1950 | El catálogo libre más grande: Roboto, Inter, Montserrat, Poppins… Filtro por categoría y orden por popularidad. |
| **Fontshare** | ~100 | Fuentes de calidad profesional de Indian Type Foundry: Satoshi, General Sans, Clash Display, Cabinet Grotesk… Gratuitas para uso personal y comercial. |
| **Fontsource** | ~119 | Familias libres (OFL o CC0) que no están en Google Fonts: Adwaita Sans, Aileron, Bagnard… |

- **Vista previa sin descargar:** las muestras se cargan solo cuando aparecen en pantalla.
- **Categorías comunes** para todos los proveedores: Serif, Sans Serif, Display, Manuscrita y Monoespaciada.
- **Sin repeticiones:** si una familia está en local y en uno o varios proveedores, aparece una sola vez con una etiqueta por cada origen.
- **Glifos y Detalles** también para las fuentes de proveedores: se descarga solo el archivo del estilo que estás consultando.
- **Descargas seguras:** si una descarga falla o se corta, no quedan familias a medias ni archivos dañados.

## Iconos

### Explorar y buscar
- **Más de 200 colecciones** de [Iconify](https://iconify.design): Material Symbols, Fluent UI, Lucide, Phosphor, Tabler, Solar y muchas más, con su licencia y autor.
- **Filtro por categoría** de colección.
- **Búsqueda en todas las colecciones a la vez**, en inglés o en español: “corazón”, “flecha hacia arriba” o “carrito de compras” se traducen automáticamente.
- Cada resultado muestra el icono, su nombre y la colección de la que viene.

### Usar los iconos
- **Arrastrar y soltar:** arrastra cualquier icono a Figma, Illustrator, Affinity, Inkscape, Photoshop o al escritorio; llega como un archivo SVG normal.
- **Clic derecho:** copiar el SVG, copiar el nombre, guardar como `.svg` o abrir la colección completa.
- **Tamaño y color:** ajusta el tamaño de la cuadrícula y recolorea los iconos de un color con el selector de color.

### Bibliotecas
- **Descargar una colección** entera para usarla sin conexión, con barra de progreso.
- **Mis bibliotecas:** acceso directo a las colecciones descargadas desde la barra lateral.
- **Favoritos:** marca colecciones con el corazón para tenerlas a mano.
- Pensado para colecciones enormes: la cuadrícula solo dibuja lo visible, así que miles de iconos se recorren con fluidez.

## Más

- **Tema claro y oscuro** para toda la interfaz.
- **Efectos de sonido** opcionales al hacer scroll, mover el tamaño y marcar favoritos.
- **Bandeja del sistema:** opción de seguir funcionando al cerrar la ventana, con icono que se adapta al tema de la barra de tareas.
- **Iniciar con Windows** (opcional).
- Velocidad de scroll ajustable y textos de ejemplo personalizables.

## Instalación

Descarga el instalador de la [última versión](https://github.com/jdsgnrinfo/fontvault/releases/latest) y ábrelo. Se instala en tu usuario, sin permisos de administrador.

El instalador no está firmado con un certificado de editor, así que Windows SmartScreen puede mostrar un aviso: pulsa *Más información → Ejecutar de todas formas*.

## Desarrollo

```bash
npm install
npm start        # compila la interfaz y abre la app
npm test         # pruebas
npm run dist     # genera el instalador en release/
```

## Licencia

FontVault es software libre bajo la [licencia MIT](LICENSE): puedes usarlo, copiarlo, modificarlo y distribuirlo, también con fines comerciales, siempre que conserves el aviso de copyright y la licencia.

Las fuentes e iconos que descargas desde la app pertenecen a sus autores y tienen su propia licencia (OFL, Apache, MIT, CC BY, licencia de Fontshare…). FontVault muestra la licencia de cada familia y colección para que puedas comprobarla.

## Invítame un café ☕

FontVault es gratis y lo desarrollo en mi tiempo libre. Si te resulta útil y quieres apoyar su desarrollo, puedes invitarme un café:

- [PayPal](https://paypal.me/jotica96)
- [GitHub Sponsors](https://github.com/sponsors/jdsgnrinfo)
