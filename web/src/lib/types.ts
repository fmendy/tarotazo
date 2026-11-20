// Tipos de la API v1 (docs/CONTRACTS.md §6) y de dominio compartido.

export type DeckFamily = 'tarot' | 'spanish';
export type SpreadId = 'dia' | 'ppf' | 'sino' | 'cruz' | 'herradura' | 'celta' | 'amor';
export type Tema = 'general' | 'amor' | 'trabajo' | 'dinero' | 'salud';
export type Tone = 'mistica' | 'abuela' | 'teletienda' | 'ironica' | 'dramatica' | 'coach';
export type Signo =
  | 'aries' | 'tauro' | 'geminis' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'escorpio' | 'sagitario' | 'capricornio' | 'acuario' | 'piscis';
export type Layout = 'single' | 'row' | 'cross' | 'horseshoe' | 'celtic' | 'love';
export type PendulumModel =
  | 'cuarzo' | 'amatista' | 'laton' | 'obsidiana' | 'madera' | 'camara' | 'llave' | 'anillo' | 'chorizo';
export type PendulumMode = 'sino' | 'tablero' | 'porcentaje' | 'ouija' | 'mapa' | 'opciones' | 'chakras';
export type Answer = 'si' | 'no' | 'skip';

export const PENDULUM_MODELS: PendulumModel[] = [
  'cuarzo', 'amatista', 'laton', 'obsidiana', 'madera', 'camara', 'llave', 'anillo', 'chorizo',
];
export const PENDULUM_MODES: PendulumMode[] = ['sino', 'tablero', 'porcentaje', 'ouija', 'mapa', 'opciones', 'chakras'];
export const TEMAS: Tema[] = ['general', 'amor', 'trabajo', 'dinero', 'salud'];

export interface DeckModel {
  id: string;
  name: string;
  description: string;
  deckSize: number;
  backImage: string;
  previewImage: string;
  imagePattern: string;
  available: boolean;
}
export interface Deck {
  family: DeckFamily;
  name: string;
  defaultModel: string;
  models: DeckModel[];
}
export interface SpreadPosition { id: string; label: string }
export interface Spread {
  id: SpreadId | string;
  name: string;
  description: string;
  size: number;
  layout: Layout;
  positions: SpreadPosition[];
}
export interface ProvinceInfo { code: string; nombre: string; comunidad: string; teaser: string; gentilicio?: string }

/** Contexto anónimo que se envía al servidor. Nunca contiene nombre, edad exacta ni pregunta. */
export interface ReadingContext {
  signo?: Signo;
  decada?: number;
  numeroVida?: number;
  provincia?: string;
  tema?: Tema;
  toneSeed: number;
  hora: number;
  diaSemana: number;
  lang: string;
}
export interface ReadingRequest {
  deck: DeckFamily;
  model: string;
  spread: string;
  cutIndex: 0 | 1 | 2;
  picks: number[];
  context: ReadingContext;
  recentFragmentIds: string[];
}
export interface ReadingLine { kind: string; text: string }
export interface Interaction { id: string; prompt: string; options: Answer[] }
export interface ReadingCard {
  position: string;
  cardId: string;
  name: string;
  reversed: boolean;
  image: string;
  tone: Tone | string;
  lines: ReadingLine[];
  interaction: Interaction | null;
}
export interface ReadingResponse {
  tone: Tone | string;
  spread: { id: string; name: string; layout: Layout; positions: SpreadPosition[] };
  intro: string;
  cards: ReadingCard[];
  summary: { text: string; luckyNumber: number; luckyColor: { name: string; hex: string } };
  outro: string;
  disclaimer: string;
  usedFragmentIds: string[];
}
export interface NextLineRequest { interactionId: string; answer: Answer; tone: string; context: ReadingContext }
export interface NextLineResponse { text: string }

export interface PendulumRequest { mode: PendulumMode; model: PendulumModel | string; options?: number; context: ReadingContext }
export type PendulumResult =
  | { answer: 'si' | 'no' | 'duda' }
  | { sector: number }
  | { value: number }
  | { word: string }
  | { provincia: string }
  | { index: number }
  | { levels: { id: string; nivel: number; informe: string }[] };
export interface PendulumResponse { mode: PendulumMode; result: PendulumResult; text: string }

export interface Title {
  id: string; titulo: string; centro: string; comentario: string; sello: string; anio: number;
  frame: 'barroco' | 'dorado' | 'madera' | 'moderno' | 'pergamino' | string;
}
export interface TitlesFile { titles: Title[] }

/** Estructura de onboarding.json (content/schemas/onboarding.schema.json). */
export type OnboardingFile = import('./onboarding').OnboardingContent;

/** GET /api/v1/content/pendulum?provincia= (cada línea = lista de variantes). */
export interface PendulumContent {
  models: Record<string, { nombre: string; personalidad: string; lines?: Record<string, string[]> }>;
  lines: Record<string, string[]>;
}

export interface ApiError { error: string; message: string }
