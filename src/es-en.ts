// Traducción español → inglés de términos habituales en iconos, para buscar en Iconify (que solo tiene nombres en inglés).
// Las claves van sin tildes y en singular; normalize() se encarga de quitar ambas cosas a lo que escribe el usuario.
const DICT: Record<string, string> = {
  // Interfaz y acciones
  casa: 'home', inicio: 'home', hogar: 'home', buscar: 'search', busqueda: 'search', lupa: 'search', ajuste: 'settings',
  configuracion: 'settings', engranaje: 'gear', menu: 'menu', cerrar: 'close', salir: 'logout', entrar: 'login', abrir: 'open',
  agregar: 'add', anadir: 'add', mas: 'plus', menos: 'minus', quitar: 'remove', eliminar: 'delete', borrar: 'delete', papelera: 'trash',
  basura: 'trash', editar: 'edit', lapiz: 'pencil', guardar: 'save', descargar: 'download', descarga: 'download', subir: 'upload',
  compartir: 'share', copiar: 'copy', pegar: 'paste', cortar: 'cut', deshacer: 'undo', rehacer: 'redo', actualizar: 'refresh',
  recargar: 'reload', sincronizar: 'sync', filtro: 'filter', filtrar: 'filter', ordenar: 'sort', lista: 'list', cuadricula: 'grid',
  tabla: 'table', vista: 'view', ver: 'eye', ojo: 'eye', ocultar: 'eye-off', mostrar: 'eye', candado: 'lock', bloquear: 'lock',
  desbloquear: 'unlock', llave: 'key', clave: 'key', escudo: 'shield', seguridad: 'shield', advertencia: 'warning', alerta: 'alert',
  error: 'error', informacion: 'info', ayuda: 'help', pregunta: 'question', exito: 'success', verificar: 'check', check: 'check',
  marca: 'check', aceptar: 'check', cancelar: 'cancel', enlace: 'link', vinculo: 'link', adjunto: 'attachment', clip: 'paperclip',
  imprimir: 'print', impresora: 'printer', expandir: 'expand', contraer: 'collapse', maximizar: 'maximize', minimizar: 'minimize',
  pantalla: 'screen', completa: 'fullscreen', arrastrar: 'drag', mover: 'move', zoom: 'zoom', ampliar: 'zoom-in', reducir: 'zoom-out',
  // Flechas y direcciones
  flecha: 'arrow', arriba: 'up', abajo: 'down', izquierda: 'left', derecha: 'right', atras: 'back', adelante: 'forward',
  siguiente: 'next', anterior: 'previous', volver: 'back', girar: 'rotate', rotar: 'rotate', circular: 'circle', chevron: 'chevron',
  // Personas y comunicación
  usuario: 'user', persona: 'person', gente: 'people', grupo: 'group', equipo: 'team', perfil: 'profile', cuenta: 'account',
  avatar: 'avatar', contacto: 'contact', correo: 'mail', email: 'mail', sobre: 'envelope', mensaje: 'message', chat: 'chat',
  comentario: 'comment', conversacion: 'chat', telefono: 'phone', llamada: 'call', movil: 'mobile', celular: 'smartphone',
  notificacion: 'notification', campana: 'bell', enviar: 'send', bandeja: 'inbox', microfono: 'microphone', altavoz: 'speaker',
  sonido: 'sound', volumen: 'volume', silencio: 'mute', auricular: 'headphones', camara: 'camera', video: 'video', foto: 'photo',
  imagen: 'image', galeria: 'gallery', reproducir: 'play', pausa: 'pause', detener: 'stop', musica: 'music', nota: 'note',
  // Archivos y documentos
  archivo: 'file', documento: 'document', carpeta: 'folder', pagina: 'page', libro: 'book', biblioteca: 'library', texto: 'text',
  fuente: 'font', letra: 'letter', tipografia: 'typography', calendario: 'calendar', fecha: 'date', reloj: 'clock', hora: 'time',
  tiempo: 'time', alarma: 'alarm', historial: 'history', etiqueta: 'tag', marcador: 'bookmark', favorito: 'favorite', estrella: 'star',
  corazon: 'heart', me: 'like', gusta: 'like', bandera: 'flag', insignia: 'badge', premio: 'award', trofeo: 'trophy', regalo: 'gift',
  codigo: 'code', terminal: 'terminal', base: 'database', datos: 'data', servidor: 'server', nube: 'cloud', grafico: 'chart',
  estadistica: 'chart', barra: 'bar', circulo: 'circle', pastel: 'pie', tarta: 'pie',
  // Comercio y finanzas
  carrito: 'cart', compra: 'shopping', tienda: 'store', bolsa: 'bag', dinero: 'money', moneda: 'coin', billetera: 'wallet',
  cartera: 'wallet', tarjeta: 'card', pago: 'payment', precio: 'price', factura: 'receipt', banco: 'bank', dolar: 'dollar', euro: 'euro',
  descuento: 'discount', oferta: 'sale', paquete: 'package', caja: 'box', envio: 'shipping', camion: 'truck',
  // Lugares, transporte y naturaleza
  mapa: 'map', ubicacion: 'location', lugar: 'place', pin: 'pin', brujula: 'compass', mundo: 'world', tierra: 'earth', globo: 'globe',
  edificio: 'building', oficina: 'office', escuela: 'school', hospital: 'hospital', coche: 'car', auto: 'car', carro: 'car',
  bicicleta: 'bike', avion: 'plane', tren: 'train', barco: 'ship', autobus: 'bus', sol: 'sun', luna: 'moon', estrella_fugaz: 'shooting-star',
  lluvia: 'rain', nieve: 'snow', viento: 'wind', clima: 'weather', fuego: 'fire', agua: 'water', gota: 'drop', hoja: 'leaf',
  arbol: 'tree', flor: 'flower', planta: 'plant', montana: 'mountain', animal: 'animal', perro: 'dog', gato: 'cat', pajaro: 'bird',
  pez: 'fish', insecto: 'bug', bicho: 'bug',
  // Objetos y dispositivos
  ordenador: 'computer', computadora: 'computer', portatil: 'laptop', tableta: 'tablet', teclado: 'keyboard', raton: 'mouse',
  monitor: 'monitor', television: 'tv', bateria: 'battery', enchufe: 'plug', energia: 'power', apagar: 'power', bombilla: 'lightbulb',
  idea: 'lightbulb', luz: 'light', wifi: 'wifi', senal: 'signal', bluetooth: 'bluetooth', herramienta: 'tool', martillo: 'hammer',
  llave_inglesa: 'wrench', tijera: 'scissors', pincel: 'brush', paleta: 'palette', color: 'color', diseno: 'design', capa: 'layer',
  forma: 'shape', cuadrado: 'square', triangulo: 'triangle', rectangulo: 'rectangle', linea: 'line', punto: 'dot', cubo: 'cube',
  comida: 'food', cafe: 'coffee', taza: 'cup', bebida: 'drink', restaurante: 'restaurant', cubierto: 'utensils', salud: 'health',
  medicina: 'medicine', pastilla: 'pill', deporte: 'sport', pelota: 'ball', juego: 'game', mando: 'gamepad', robot: 'robot',
  cohete: 'rocket', escritorio: 'desktop', ventana: 'window', puerta: 'door', cama: 'bed', silla: 'chair',
  // Emociones
  cara: 'face', sonrisa: 'smile', feliz: 'happy', triste: 'sad', enojado: 'angry', emoji: 'emoji', reciclaje: 'recycle', reciclar: 'recycle',
};

const STOP = new Set(['hacia', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'con', 'para', 'por', 'y', 'o', 'en', 'al', 'sin']);

// Minúsculas, sin tildes ni diéresis, sin plural simple
function normalize(word: string) {
  const w = word.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (DICT[w]) return w;
  if (w.endsWith('es') && DICT[w.slice(0, -2)]) return w.slice(0, -2);
  if (w.endsWith('s') && DICT[w.slice(0, -1)]) return w.slice(0, -1);
  return w;
}

// Devuelve la consulta en inglés, o null si no había nada que traducir
export function translateQuery(query: string): string | null {
  // Las palabras de enlace no aportan nada a la búsqueda en inglés
  const words = query.trim().split(/\s+/).filter((w) => w && !STOP.has(normalize(w)));
  let changed = false;
  const out = words.map((word) => {
    const key = normalize(word);
    const en = DICT[key];
    if (en && en !== word.toLowerCase()) { changed = true; return en; }
    return word;
  });
  // Si algo se tradujo, las palabras que no están en el diccionario casi seguro son español y estorban
  const kept = out.filter((w, i) => DICT[normalize(words[i])] || !changed);
  return changed && kept.length ? kept.join(' ') : null;
}
