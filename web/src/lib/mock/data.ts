// Datos de ejemplo para el mock del API (sólo desarrollo, VITE_MOCK_API=1).
import type { Deck, Spread, Title } from '../types';
import type { OnboardingContent } from '../onboarding';

const MAJORS = [
  'El Loco', 'El Mago', 'La Sacerdotisa', 'La Emperatriz', 'El Emperador', 'El Hierofante', 'Los Enamorados',
  'El Carro', 'La Fuerza', 'El Ermitaño', 'La Rueda de la Fortuna', 'La Justicia', 'El Colgado', 'La Muerte',
  'La Templanza', 'El Diablo', 'La Torre', 'La Estrella', 'La Luna', 'El Sol', 'El Juicio', 'El Mundo',
];
const SUITS = ['bastos', 'copas', 'espadas', 'oros'] as const;
const SUIT_NAMES: Record<string, string> = { bastos: 'Bastos', copas: 'Copas', espadas: 'Espadas', oros: 'Oros' };
const RANK_NAMES: Record<string, string> = {
  '01': 'As', '02': 'Dos', '03': 'Tres', '04': 'Cuatro', '05': 'Cinco', '06': 'Seis', '07': 'Siete', '08': 'Ocho',
  '09': 'Nueve', '10': 'Diez', sota: 'Sota', caballo: 'Caballo', reina: 'Reina', rey: 'Rey',
};

export function tarotCards(): { id: string; name: string }[] {
  const out = MAJORS.map((name, i) => ({ id: `mayor-${String(i).padStart(2, '0')}`, name }));
  const ranks = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'sota', 'caballo', 'reina', 'rey'];
  for (const s of SUITS) for (const r of ranks) out.push({ id: `${s}-${r}`, name: `${RANK_NAMES[r]} de ${SUIT_NAMES[s]}` });
  return out;
}
export function spanishCards(size: 40 | 48): { id: string; name: string }[] {
  const ranks = ['01', '02', '03', '04', '05', '06', '07', ...(size === 48 ? ['08', '09'] : []), 'sota', 'caballo', 'rey'];
  const out: { id: string; name: string }[] = [];
  for (const s of SUITS) for (const r of ranks) out.push({ id: `${s}-${r}`, name: `${RANK_NAMES[r]} de ${SUIT_NAMES[s]}` });
  return out;
}

function model(family: string, id: string, name: string, description: string, deckSize: number, available: boolean) {
  const preview = family === 'tarot' ? 'mayor-00' : 'oros-01';
  return {
    id, name, description, deckSize,
    backImage: `/art/backs/${id}.svg`,
    previewImage: `/art/cards/${id}/${preview}.svg`,
    imagePattern: `/art/cards/${id}/{cardId}.svg`,
    available,
  };
}

export const DECKS: Deck[] = [
  {
    family: 'tarot', name: 'Tarot tradicional', defaultModel: 'rws',
    models: [
      model('tarot', 'rws', 'Rider‑Waite‑Smith', 'El clásico de 1909. Menores con escenas.', 78, true),
      model('tarot', 'marsella', 'Tarot de Marsella', 'Estilo grabado antiguo, menores de pips.', 78, true),
      model('tarot', 'neon', 'Neón de madrugada', 'Para leer el futuro con gafas de sol.', 78, false),
      model('tarot', 'acuarela', 'Acuarela', 'Suave, como tu futuro (o no).', 78, false),
      model('tarot', 'pixel', 'Pixel‑art', '8 bits de destino.', 78, false),
      model('tarot', 'gatos', 'Gatos', 'Todos los arcanos tienen bigotes.', 78, false),
    ],
  },
  {
    family: 'spanish', name: 'Baraja española', defaultModel: 'castellana',
    models: [
      model('spanish', 'castellana', 'Castellana clásica', 'La de la partida de tute del abuelo.', 40, true),
      model('spanish', 'catalana', 'Catalana antigua', 'Con solera y bigote.', 48, false),
      model('spanish', 'ilustrada', 'Ilustrada de la casa', 'Arte propio, sin herencias.', 40, false),
    ],
  },
];

const POS: Record<string, string> = {
  consejo: 'Consejo', pasado: 'Pasado', presente: 'Presente', futuro: 'Futuro', respuesta: 'Respuesta',
  situacion: 'Situación', obstaculo: 'Obstáculo', resultado: 'Resultado', entorno: 'Entorno', obstaculos: 'Obstáculos',
  tu: 'Tú', otra: 'La otra persona', une: 'Lo que os une', separa: 'Lo que os separa',
  cubre: 'Lo que te cubre', cruza: 'Lo que te cruza', corona: 'Corona', base: 'Base', actitud: 'Actitud',
  esperanzas: 'Esperanzas y miedos', matiz: 'Matiz', remate: 'Remate',
};
function spread(id: string, name: string, description: string, layout: Spread['layout'], positions: string[]): Spread {
  return { id, name, description, size: positions.length, layout, positions: positions.map((p) => ({ id: p, label: POS[p] ?? p })) };
}
export const SPREADS: Spread[] = [
  spread('dia', 'Carta del día', 'Una carta, un consejo y a desayunar.', 'single', ['consejo']),
  spread('ppf', 'Pasado, presente y futuro', 'El clásico de los clásicos.', 'row', ['pasado', 'presente', 'futuro']),
  spread('sino', 'Sí o no', 'Derecha es sí, invertida es no. Más o menos.', 'row', ['respuesta', 'matiz', 'remate']),
  spread('cruz', 'Cruz simple', 'Cinco cartas para ver por dónde te viene el aire.', 'cross', ['situacion', 'obstaculo', 'pasado', 'futuro', 'resultado']),
  spread('herradura', 'Herradura', 'Siete cartas y un poco de suerte.', 'horseshoe', ['pasado', 'presente', 'futuro', 'consejo', 'entorno', 'obstaculos', 'resultado']),
  spread('celta', 'Cruz Celta', 'La de Waite. Diez cartas, palabras mayores.', 'celtic', ['cubre', 'cruza', 'corona', 'base', 'pasado', 'futuro', 'actitud', 'entorno', 'esperanzas', 'resultado']),
  spread('amor', 'Amor (pareja)', 'Tú, la otra persona y lo que hay entre medias.', 'love', ['tu', 'otra', 'une', 'separa', 'consejo', 'futuro']),
];

export const TITLES: Title[] = [
  ['magia-torrelodones', 'Graduada en Artes Mágicas Avanzadas', 'Real Colegio de Magia de Torrelodones', 'Saqué matrícula en pociones; en escobas, un aprobadillo.', 'Compulsado por la conserje, que también hace conjuros.', 1987, 'barroco'],
  ['master-bola', 'Máster en Bola de Cristal (especialidad: niebla)', 'Universidad a Distancia del Más Allá', 'Lo hice online. Desde el otro lado.', 'Sello traído por una paloma mensajera con wifi.', 1993, 'dorado'],
  ['doctorado-posos', 'Doctorado Cum Laude en Posos de Café', 'Facultad de Cafeteromancia de Colombia la Chica', 'Tesis: «El descafeinado no predice nada».', 'Huele a cortado.', 1999, 'pergamino'],
  ['b2-lenguas', 'Certificado B2 en Lenguas Muertas (y Medio Muertas)', 'Escuela Oficial de Idiomas Espectrales', 'Hablo con mi abuela sin problema.', 'Compulsado en una sesión de espiritismo.', 2001, 'madera'],
  ['experta-invertidas', 'Experta en Cartas Invertidas', 'Instituto del Revés', 'También leo el periódico boca abajo.', 'odɐsluduoↃ', 2004, 'moderno'],
  ['carnet-escobas', 'Carnet de Conducir Escobas, clase B', 'DGT (Dirección General de Trayectos Aéreos)', 'Tres puntos menos por sobrevolar la M‑30.', 'Válido salvo niebla.', 2008, 'moderno'],
  ['cinturon-pendulo', 'Cinturón Negro en Péndulo', 'Federación Española de Oscilación', 'Mi péndulo y yo competimos en sincronizado.', 'Sello que oscila solo.', 2011, 'madera'],
  ['manipulador-pociones', 'Curso de Manipulador de Pociones', 'Consejería de Sanidad Mágica', 'Obligatorio desde lo del filtro de amor de 2019.', 'Lávese las manos tras conjurar.', 2019, 'pergamino'],
  ['premio-horoscopo', 'Premio Extraordinario de Fin de Horóscopo', 'Academia de Astrología Recreativa', 'Mercurio retrógrado y aun así lo saqué.', 'Compulsado en luna llena (con flexo).', 2015, 'dorado'],
  ['gatos-negros', 'Diploma de Asistencia: Taller de Gatos Negros', 'Ayuntamiento de Zugarramurdi', 'Sólo fui al café, pero cuenta.', 'Con huella de gato auténtica.', 2021, 'barroco'],
].map(([id, titulo, centro, comentario, sello, anio, frame]) => ({
  id: id as string, titulo: titulo as string, centro: centro as string, comentario: comentario as string,
  sello: sello as string, anio: anio as number, frame: frame as string,
}));

export const ONBOARDING: OnboardingContent = {
  puerta: {
    titulo: 'Antes de entrar, criatura…',
    pregunta: '¿Eres mayor de edad?',
    aviso: 'Esto es entretenimiento: ni consejo médico, ni legal, ni financiero. La bola de cristal es de mentira (la vidente no).',
    si: 'Sí, tengo 18 o más',
    no: 'Todavía no',
    fecha: 'O dime tu fecha de nacimiento',
    bienvenida: ['Pasa, pasa, que se enfría el incienso.'],
  },
  menor: ['Uy, todavía no te toca. Vuelve cuando cumplas 18, que las cartas no se van a ningún sitio.'],
  nombre: {
    pregunta: ['¿Cómo te llamas, alma cándida?'],
    especiales: {
      vanesa: ['¿Vanesa? Las Vanesas siempre llegan tarde a su destino… pero llegan.'],
      'jose luis': ['{nombre}… nombre compuesto, destino compuesto.'],
    },
    santoral: { maria: '15 de agosto', jose: '19 de marzo' },
    santoralLines: ['Tu santo es el {santo}. Lo apunto, que luego se me olvida felicitarte.'],
    porTerminacion: { ana: ['¿{nombre}? Rima con mañana, y mañana te va a ir bien.'] },
    porInicial: { M: ['La M de {nombre}… la M de misterio, claro.'] },
    porLongitud: [
      { min: 1, max: 3, lines: ['{letras} letras nada más. Corto pero intenso.'] },
      { min: 10, max: 40, lines: ['{letras} letras… me cansa hasta escribirlo en la bola.'] },
    ],
    genericas: ['{nombre}… [precioso|qué bonito|me suena de algo]. Las cartas ya te estaban esperando.'],
  },
  edad: {
    pregunta: ['¿Y cuántas primaveras llevas?'],
    porDecada: {
      '10': ['Recién estrenada la mayoría de edad. Las cartas te tratarán con cariño.'],
      '20': ['Los veinte: la década de no saber qué hacer, pero con mucha energía.'],
      '30': ['Los treinta: te levantas del sofá y haces un ruido. Normal.'],
      '40': ['Los cuarenta: experiencia, sabiduría y gafas para ver de cerca.'],
    },
    signo: { leo: ['Leo… ya me parecía a mí ese brillo en la mirada.'], piscis: ['Piscis: sensible, soñador y siempre con frío.'] },
    numeroVida: { '7': ['Número de vida 7: el de los que piensan demasiado. Te pega.'], '11': ['¡Un 11! Número maestro. Yo me lo creería.'] },
    sinFecha: ['Sin fecha no te saco el signo, pero intuyo cosas.'],
    genericas: ['{edad} años. Edad perfecta para que te echen las cartas.'],
  },
  provincia: {
    pregunta: ['¿Y de dónde eres, de nacimiento?'],
    genericas: ['¡De {provincia}! Ya decía yo. {chascarrillo}'],
    extranjero: ['¿Fuera de España? Las cartas tienen pasaporte, tranquilidad.'],
  },
};
export const ENTRADAS = ['Mmm…', '¡Ojo!', 'Uy, uy, uy…', 'A ver, a ver…', '…', '¡Toma ya!'];
export const PUENTES = ['En {posicion}…', 'Y aquí, en {posicion}…', 'Mira lo que sale en {posicion}:'];
export const NUCLEOS = [
  'Esta carta habla de un cambio que llega sin hacer ruido, como el gato a la cocina.',
  'Aquí veo energía para empezar algo, aunque sea ordenar el armario.',
  'Hay emociones bonitas rondando. Déjalas pasar, que traen merienda.',
  'Toca pensar con calma antes de decidir. Ni corriendo ni parado.',
  'Un cierre que abre otra puerta. Ponle aceite a las bisagras.',
];
export const PERSONAL = [
  '{nombre}, esto con tu número de vida tiene todo el sentido.',
  'Ay, {nombre}, ¿ves cómo las cartas te conocen?',
  'Esto a los {edad} se nota más, {nombre}. Para bien.',
];
export const GUINOS = [
  'Como decía mi abuela: «quien baraja, se apaña».',
  'No lo digo yo, lo dice la carta. Yo sólo trabajo aquí.',
  'Y esto sin haber tomado el café, que si no…',
];
export const INTERACTIONS = [
  { id: 'letra-m', prompt: '¿Hay alguien con la letra M en tu vida?', branches: {
    si: 'Lo sabía. Esa M tiene algo que decirte… o te debe dinero.',
    no: '¿No? Pues búscala, que por algo sale.',
    skip: 'Discreción. Me gusta. La carta también calla.' } },
  { id: 'viaje', prompt: '¿Tienes pensado algún viaje?', branches: {
    si: 'Pues lleva rebeca, que la carta ve corriente.',
    no: 'Entonces el viaje será interior. Más barato.',
    skip: 'Vale, vale, que no se entere nadie.' } },
];
export const PENDULUM_CONTENT = (provincia: string) => ({
  models: {
    cuarzo: { nombre: 'Cuarzo cristalino', personalidad: 'Transparente, sincero y algo presumido.', lines: { enfado: ['El cuarzo se ha puesto opaco. Eso es enfado de cristal.'] } },
    amatista: { nombre: 'Amatista', personalidad: 'Calmada, muy de meditar con incienso.' },
    laton: { nombre: 'Latón cónico', personalidad: 'Serio, puntiagudo y puntual.' },
    obsidiana: { nombre: 'Obsidiana', personalidad: 'Oscura, misteriosa, contesta con pausas dramáticas.' },
    madera: { nombre: 'Madera de olivo', personalidad: 'De pueblo, sabio y con olor a aceite.' },
    camara: { nombre: 'Cámara egipcia', personalidad: 'Hueco por dentro, pero con mucha historia.' },
    llave: { nombre: 'La llave del trastero', personalidad: 'Abre puertas. Bueno, una: la del trastero.' },
    anillo: { nombre: 'El anillo de la abuela', personalidad: 'Cariñoso y cotilla, como la abuela.' },
    chorizo: { nombre: `Chorizo de ${provincia}`, personalidad: 'Picante o dulce según el día.' },
  },
  lines: {
    intro: ['Coge la cadena con dos dedos, sin apretar, como quien sujeta un secreto.'],
    'calibrar.intro': ['Primero vamos a calibrar. Péndulo, enséñanos tu sí.'],
    'calibrar.si': ['Ese es su sí. Apúntalo mentalmente.'],
    'calibrar.no': ['Y ese, su no. Ya os conocéis.'],
    concentrar: ['Apago las luces. Piensa en tu pregunta… pero no tan fuerte, que se te arruga la frente.'],
    repetida: ['Esa pregunta me suena… El péndulo también se acuerda.'],
    enfado: ['¡Tres veces lo mismo! El péndulo se ha enrollado en la cadena y no te habla.'],
    medianoche: ['Medianoche en punto: el péndulo brilla. Está en su hora.'],
  },
});
export const OUIJA_WORDS = ['SI', 'NO', 'AMOR', 'PIZZA', 'SIESTA', 'GATO', 'VIAJE', 'LUNA', 'CHURROS'];
export const CHAKRAS = [
  ['raiz', 'Raíz'], ['sacro', 'Sacro'], ['plexo', 'Plexo solar'], ['corazon', 'Corazón'],
  ['garganta', 'Garganta'], ['tercerOjo', 'Tercer ojo'], ['corona', 'Corona'],
];
export const COLORS = [
  { name: 'verde botella', hex: '#1f5e3b' }, { name: 'morado nazareno', hex: '#5b2a6e' },
  { name: 'amarillo pollito', hex: '#f3d34a' }, { name: 'rojo pasión', hex: '#b3202a' },
  { name: 'azul piscina', hex: '#2f8fcf' }, { name: 'naranja butano', hex: '#f08a24' },
];
