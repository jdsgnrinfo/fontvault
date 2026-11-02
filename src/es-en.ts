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
  pantalla: 'screen', arrastrar: 'drag', mover: 'move', zoom: 'zoom', ampliar: 'zoom-in', reducir: 'zoom-out',
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
  corazon: 'heart', bandera: 'flag', insignia: 'badge', premio: 'award', trofeo: 'trophy', regalo: 'gift',
  codigo: 'code', terminal: 'terminal', datos: 'data', servidor: 'server', nube: 'cloud', grafico: 'chart',
  estadistica: 'chart', barra: 'bar', circulo: 'circle', pastel: 'pie', tarta: 'pie',
  // Comercio y finanzas
  carrito: 'cart', compra: 'shopping', tienda: 'store', bolsa: 'bag', dinero: 'money', moneda: 'coin', billetera: 'wallet',
  cartera: 'wallet', tarjeta: 'card', pago: 'payment', precio: 'price', factura: 'receipt', banco: 'bank', dolar: 'dollar', euro: 'euro',
  descuento: 'discount', oferta: 'sale', paquete: 'package', caja: 'box', envio: 'shipping', camion: 'truck',
  // Lugares, transporte y naturaleza
  mapa: 'map', ubicacion: 'location', lugar: 'place', pin: 'pin', brujula: 'compass', mundo: 'world', tierra: 'earth', globo: 'globe',
  edificio: 'building', oficina: 'office', escuela: 'school', hospital: 'hospital', coche: 'car', auto: 'car', carro: 'car',
  bicicleta: 'bike', avion: 'plane', tren: 'train', barco: 'ship', autobus: 'bus', sol: 'sun', luna: 'moon',
  lluvia: 'rain', nieve: 'snow', viento: 'wind', clima: 'weather', fuego: 'fire', agua: 'water', gota: 'drop', hoja: 'leaf',
  arbol: 'tree', flor: 'flower', planta: 'plant', montana: 'mountain', animal: 'animal', perro: 'dog', gato: 'cat', pajaro: 'bird',
  pez: 'fish', insecto: 'bug', bicho: 'bug',
  // Objetos y dispositivos
  ordenador: 'computer', computadora: 'computer', portatil: 'laptop', tableta: 'tablet', teclado: 'keyboard', raton: 'mouse',
  monitor: 'monitor', television: 'tv', bateria: 'battery', enchufe: 'plug', energia: 'power', apagar: 'power', bombilla: 'lightbulb',
  idea: 'lightbulb', luz: 'light', wifi: 'wifi', senal: 'signal', bluetooth: 'bluetooth', herramienta: 'tool', martillo: 'hammer',
  tijera: 'scissors', pincel: 'brush', paleta: 'palette', color: 'color', diseno: 'design', capa: 'layer',
  forma: 'shape', cuadrado: 'square', triangulo: 'triangle', rectangulo: 'rectangle', linea: 'line', punto: 'dot', cubo: 'cube',
  comida: 'food', cafe: 'coffee', taza: 'cup', bebida: 'drink', restaurante: 'restaurant', cubierto: 'utensils', salud: 'health',
  medicina: 'medicine', pastilla: 'pill', deporte: 'sport', pelota: 'ball', juego: 'game', mando: 'gamepad', robot: 'robot',
  cohete: 'rocket', escritorio: 'desktop', ventana: 'window', puerta: 'door', cama: 'bed', silla: 'chair',
  credito: 'credit', seleccion: 'select', unicornio: 'unicorn', // tarjeta de crédito
  // Colores y adjetivos
  rojo: 'red', azul: 'blue', verde: 'green', amarillo: 'yellow', naranja: 'orange', morado: 'purple', violeta: 'violet', rosa: 'pink',
  negro: 'black', blanco: 'white', gris: 'gray', marron: 'brown', dorado: 'gold', plateado: 'silver', roto: 'broken', nuevo: 'new',
  grande: 'large', pequeno: 'small', lleno: 'filled', vacio: 'empty', redondo: 'round', abierto: 'open', cerrado: 'closed', doble: 'double',
  // Acciones
  iniciar: 'start', comenzar: 'start', parar: 'stop', seleccionar: 'select', elegir: 'select', crear: 'create', duplicar: 'duplicate',
  renombrar: 'rename', cambiar: 'change', reemplazar: 'replace', exportar: 'export', importar: 'import', instalar: 'install', conectar: 'connect',
  desconectar: 'disconnect', publicar: 'publish', firmar: 'signature', escribir: 'write', leer: 'read', dibujar: 'draw', pintar: 'paint',
  medir: 'ruler', pulsar: 'click', tocar: 'touch', mirar: 'eye', oir: 'ear', hablar: 'talk', sonreir: 'smile', caminar: 'walk', correr: 'run',
  nadar: 'swim', cocinar: 'cooking', comer: 'eat', beber: 'drink', dormir: 'sleep', viajar: 'travel', volar: 'fly', conducir: 'car',
  pagar: 'payment', comprar: 'shopping', vender: 'sell', ganar: 'trophy', perder: 'lose', aprobar: 'approve', rechazar: 'reject', enfocar: 'focus',
  // Interfaz
  boton: 'button', icono: 'icon', opcion: 'options', panel: 'panel', tablero: 'dashboard', pestana: 'tab',
  interruptor: 'toggle', deslizador: 'slider', casilla: 'checkbox', cursor: 'cursor', puntero: 'pointer', mano: 'hand',
  dedo: 'finger', huella: 'fingerprint', contrasena: 'password', sesion: 'session', cargando: 'loading', carga: 'loading', progreso: 'progress',
  rayo: 'bolt', relampago: 'lightning', trueno: 'thunder', tormenta: 'storm', arcoiris: 'rainbow', copo: 'snowflake',
  // Personas y cuerpo
  hombre: 'man', mujer: 'woman', nino: 'child', bebe: 'baby', familia: 'family', amigo: 'friend', medico: 'doctor', doctor: 'doctor', enfermera: 'nurse',
  policia: 'police', bombero: 'firefighter', profesor: 'teacher', estudiante: 'student', cabeza: 'head', pelo: 'hair', oreja: 'ear', nariz: 'nose',
  boca: 'mouth', labio: 'lips', diente: 'tooth', pie: 'foot', pierna: 'leg', brazo: 'arm', cerebro: 'brain', hueso: 'bone', sangre: 'blood', esqueleto: 'skeleton', calavera: 'skull',
  // Comunicación y oficina
  carta: 'letter', periodico: 'newspaper', noticia: 'news', revista: 'magazine', cuaderno: 'notebook', boligrafo: 'pen', pluma: 'feather', regla: 'ruler',
  grapadora: 'stapler', maletin: 'briefcase', trabajo: 'work', reunion: 'meeting', presentacion: 'presentation', contrato: 'contract', firma: 'signature',
  informe: 'report', tarea: 'task', proyecto: 'project', objetivo: 'target', meta: 'goal', diana: 'target', idioma: 'language', traducir: 'translate',
  // Hogar y objetos
  mesa: 'table', sofa: 'sofa', lampara: 'lamp', espejo: 'mirror', paraguas: 'umbrella', gafas: 'glasses', lentes: 'glasses',
  sombrero: 'hat', gorra: 'cap', corona: 'crown', camisa: 'shirt', camiseta: 'tshirt', zapato: 'shoe', ropa: 'clothes', mochila: 'backpack', anillo: 'ring',
  diamante: 'diamond', joya: 'gem', vela: 'candle', ducha: 'shower', bano: 'bath', inodoro: 'toilet', jabon: 'soap', lavadora: 'washing-machine',
  nevera: 'fridge', refrigerador: 'fridge', horno: 'oven', cocina: 'kitchen', ascensor: 'elevator', escalera: 'stairs', garaje: 'garage', jardin: 'garden', valla: 'fence',
  // Herramientas y tecnología
  destornillador: 'screwdriver', tornillo: 'screw', tuerca: 'nut', pala: 'shovel', hacha: 'axe', sierra: 'saw', cable: 'cable', antena: 'antenna', radio: 'radio',
  cascos: 'headphones', reproductor: 'player', pelicula: 'movie', cine: 'cinema', disco: 'disk', memoria: 'memory',
  procesador: 'cpu', chip: 'chip', nave: 'spaceship', satelite: 'satellite', telescopio: 'telescope', microscopio: 'microscope', iman: 'magnet', red: 'network', navegador: 'browser',
  impresion: 'print', escaner: 'scanner', inteligencia: 'ai', aplicacion: 'app', programa: 'app', sitio: 'website', web: 'web', virus: 'virus',
  // Comida
  manzana: 'apple', platano: 'banana', uva: 'grape', fresa: 'strawberry', limon: 'lemon', cereza: 'cherry', sandia: 'watermelon', pina: 'pineapple', zanahoria: 'carrot',
  tomate: 'tomato', cebolla: 'onion', pan: 'bread', queso: 'cheese', huevo: 'egg', carne: 'meat', pollo: 'chicken', hamburguesa: 'hamburger', helado: 'ice-cream',
  galleta: 'cookie', chocolate: 'chocolate', vino: 'wine', cerveza: 'beer', botella: 'bottle', vaso: 'glass', plato: 'plate', tenedor: 'fork', cuchillo: 'knife', cuchara: 'spoon', olla: 'pot', sarten: 'pan',
  // Animales y naturaleza
  caballo: 'horse', vaca: 'cow', cerdo: 'pig', oveja: 'sheep', conejo: 'rabbit', leon: 'lion', tigre: 'tiger', oso: 'bear', mono: 'monkey', elefante: 'elephant',
  serpiente: 'snake', tortuga: 'turtle', rana: 'frog', mariposa: 'butterfly', abeja: 'bee', arana: 'spider', hormiga: 'ant', pata: 'paw', ballena: 'whale', tiburon: 'shark', pulpo: 'octopus',
  mar: 'sea', playa: 'beach', isla: 'island', rio: 'river', bosque: 'forest', ola: 'wave', semilla: 'seed', cactus: 'cactus', seta: 'mushroom', piedra: 'stone', termometro: 'thermometer', temperatura: 'temperature', niebla: 'fog',
  // Lugares y transporte
  ciudad: 'city', pais: 'country', calle: 'road', carretera: 'road', puente: 'bridge', parque: 'park', museo: 'museum', iglesia: 'church', castillo: 'castle', fabrica: 'factory',
  universidad: 'university', hotel: 'hotel', aeropuerto: 'airport', estacion: 'station', gasolina: 'gas', moto: 'motorcycle', motocicleta: 'motorcycle', taxi: 'taxi', ambulancia: 'ambulance', helicoptero: 'helicopter',
  metro: 'subway', ancla: 'anchor', rueda: 'wheel', semaforo: 'traffic-light',
  // Comercio, salud y ocio
  recibo: 'receipt', cupon: 'coupon', venta: 'sale', cliente: 'customer', empresa: 'company', negocio: 'business', finanza: 'finance', ahorro: 'savings', hucha: 'piggy-bank', porcentaje: 'percent', calculadora: 'calculator', balanza: 'scale', peso: 'weight',
  jeringa: 'syringe', vacuna: 'vaccine', estetoscopio: 'stethoscope', tirita: 'bandage', venda: 'bandage', ejercicio: 'fitness', pesa: 'dumbbell',
  futbol: 'soccer', baloncesto: 'basketball', tenis: 'tennis', beisbol: 'baseball', golf: 'golf', ajedrez: 'chess', dado: 'dice', guitarra: 'guitar', piano: 'piano', tambor: 'drum', medalla: 'medal', fiesta: 'party', cumpleanos: 'birthday', pastelito: 'cupcake', navidad: 'christmas', vacaciones: 'vacation', maleta: 'suitcase', acampar: 'camping',
  matematica: 'math', ciencia: 'science', quimica: 'chemistry', atomo: 'atom', arte: 'art', cuadro: 'frame', dibujo: 'drawing', escultura: 'sculpture', ley: 'law', justicia: 'justice', religion: 'religion', cruz: 'cross', paz: 'peace', guerra: 'war', arma: 'weapon', pistola: 'gun', espada: 'sword', bomba: 'bomb', muerte: 'skull', fantasma: 'ghost', extraterrestre: 'alien', magia: 'magic', varita: 'wand', amor: 'love', beso: 'kiss',
  // Emociones
  cara: 'face', sonrisa: 'smile', feliz: 'happy', triste: 'sad', enojado: 'angry', emoji: 'emoji', reciclaje: 'recycle', reciclar: 'recycle',
};

// Expresiones de varias palabras que no se traducen palabra por palabra (ya normalizadas y sin palabras de enlace)
const PHRASES: Record<string, string> = {
  'me gusta': 'like', 'no me gusta': 'dislike', 'base datos': 'database', 'pantalla completa': 'fullscreen', 'llave inglesa': 'wrench',
  'estrella fugaz': 'shooting-star', 'cerrar sesion': 'logout', 'iniciar sesion': 'login', 'codigo qr': 'qr-code', 'codigo barra': 'barcode',
  'reloj arena': 'hourglass', 'barra lateral': 'sidebar', 'ventana emergente': 'popup', 'inteligencia artificial': 'ai',
  'red sociales': 'social', 'red social': 'social', 'tienda campana': 'tent', 'huevo pascua': 'easter-egg',
};

// Iconify solo encuentra el término exacto: un mismo concepto puede estar con otro nombre según la colección
const SYNONYMS: Record<string, string[]> = {
  home: ['house'], trash: ['bin', 'delete'], delete: ['trash'], settings: ['gear', 'cog'], gear: ['settings', 'cog'], mail: ['email', 'envelope'], envelope: ['mail'],
  car: ['automobile', 'vehicle'], plane: ['airplane', 'flight'], phone: ['telephone', 'call'], image: ['picture', 'photo'], photo: ['image', 'picture'],
  user: ['person', 'account'], person: ['user'], people: ['users', 'group'], group: ['users', 'people'], team: ['users', 'group'], close: ['x', 'cross'], cancel: ['x', 'close'],
  check: ['tick', 'done'], lightbulb: ['bulb', 'idea'], bolt: ['flash', 'lightning'], lightning: ['bolt', 'flash'], favorite: ['star', 'heart'], money: ['cash', 'currency'],
  shopping: ['shop', 'buy'], cart: ['basket', 'shopping-cart'], store: ['shop'], bike: ['bicycle'], ship: ['boat'], tree: ['forest'], time: ['clock'], date: ['calendar'],
  notification: ['bell', 'alert'], chart: ['graph', 'analytics'], world: ['globe', 'earth'], earth: ['globe', 'world'], location: ['map-pin', 'marker', 'place'], place: ['map-pin', 'location'],
  document: ['file'], file: ['document'], note: ['notes'], computer: ['pc', 'desktop'], laptop: ['notebook'], smartphone: ['mobile', 'phone'], mobile: ['smartphone', 'phone'],
  speaker: ['volume', 'sound'], sound: ['volume', 'audio'], music: ['musical-note', 'audio'], refresh: ['reload', 'sync'], add: ['plus'], remove: ['minus'], edit: ['pencil'], pencil: ['edit'],
  shipping: ['delivery', 'truck'], truck: ['delivery'], package: ['box'], wallet: ['purse'], bank: ['building-bank'], food: ['restaurant', 'meal'], utensils: ['fork', 'cutlery'],
  headphones: ['headset'], baby: ['infant'], child: ['kid'], man: ['male'], woman: ['female'], tooth: ['dental'], doctor: ['medical'], medicine: ['pill', 'medical'], health: ['medical', 'heart-pulse'],
  dumbbell: ['weights', 'gym'], fitness: ['gym', 'dumbbell'], soccer: ['football'], hamburger: ['burger'], tv: ['television'], window: ['app'], sofa: ['couch'], shirt: ['tshirt'], tshirt: ['shirt'], motorcycle: ['moto', 'bike'],
};
const MAX_QUERIES = 4;

const STOP = new Set(['hacia', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'con', 'para', 'por', 'y', 'o', 'en', 'al', 'sin']);
const has = (w: string) => Object.hasOwn(DICT, w);
const plain = (word: string) => word.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Minúsculas, sin tildes, y la forma del diccionario: singular y masculino (rojas → rojo, luces → luz, lápices → lapiz)
function normalize(word: string) {
  const w = plain(word);
  const singular = [w, w.endsWith('ces') ? w.slice(0, -3) + 'z' : '', w.endsWith('es') ? w.slice(0, -2) : '', w.endsWith('s') ? w.slice(0, -1) : ''].filter(Boolean);
  for (const s of singular) if (has(s)) return s;
  for (const s of singular) {
    const swap = s.endsWith('a') ? s.slice(0, -1) + 'o' : s.endsWith('o') ? s.slice(0, -1) + 'a' : '';
    if (swap && has(swap)) return swap;
  }
  return w;
}

// Separa lo que el diccionario conoce de lo que no; primero las expresiones más largas
function scan(query: string) {
  const words = query.trim().split(/\s+/).filter((w) => w && !STOP.has(plain(w))).map(normalize);
  const out: string[] = [];
  let unknown = false;
  for (let i = 0; i < words.length;) {
    const len = [3, 2].find((n) => i + n <= words.length && PHRASES[words.slice(i, i + n).join(' ')]);
    if (len) { out.push(PHRASES[words.slice(i, i + len).join(' ')]); i += len; continue; }
    if (has(words[i])) out.push(DICT[words[i]]); else unknown = true;
    i++;
  }
  return { terms: [...new Set(out)], unknown };
}

// El diccionario no lo cubre todo: si falta alguna palabra hay que traducir la consulta en línea
export const needsOnline = (query: string) => scan(query).unknown;

// "The Blue Octopus." → "blue octopus": Iconify busca palabras sueltas y no entiende artículos ni puntuación
export const cleanTranslation = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().split(/\s+/).filter((w, i) => w && !(i === 0 && /^(the|a|an|to)$/.test(w))).join(' ');

// Todas las búsquedas en inglés para una consulta, de la más probable a la menos; vacío si no hay nada que traducir
export function translateQueries(query: string): string[] {
  const { terms } = scan(query);
  if (!terms.length || terms.join(' ') === query.trim().toLowerCase()) return [];
  const queries = [terms.join(' ')];
  for (let i = 0; i < terms.length; i++) for (const alt of (Object.hasOwn(SYNONYMS, terms[i]) ? SYNONYMS[terms[i]] : [])) queries.push(terms.map((t, j) => (j === i ? alt : t)).join(' '));
  return [...new Set(queries)].slice(0, MAX_QUERIES);
}

export const translateQuery = (query: string) => translateQueries(query)[0] ?? null;
