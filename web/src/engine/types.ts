// Tipos del motor local. Los de la API vienen de src/lib/types.ts (frontend); aquí sólo se añaden los campos
// aditivos que devuelve también el backend Java (description, numerals, minSize, zona…) y el modelo de contenido.
import type {
  Deck, DeckModel, NextLineRequest, NextLineResponse, OnboardingFile, PendulumContent, PendulumRequest,
  PendulumResponse, ProvinceInfo, ReadingRequest, ReadingResponse, Spread, TitlesFile,
} from '../lib/types';

export type {
  NextLineRequest, NextLineResponse, OnboardingFile, PendulumContent, PendulumRequest, PendulumResponse,
  ReadingRequest, ReadingResponse, TitlesFile,
};

// ---------------------------------------------------------------- respuestas (extensiones aditivas del API Java)

/** GET /decks → models[]: el API añade `numerals` (y `description` puede ser null). */
export interface EngineDeckModel extends Omit<DeckModel, 'description' | 'previewImage'> {
  description: string | null;
  previewImage: string | null;
  numerals: Record<string, string>;
}
/** GET /decks: el API añade `description`. */
export interface EngineDeck extends Omit<Deck, 'models'> {
  description: string | null;
  models: EngineDeckModel[];
}
/** GET /spreads: el API añade `minSize` (null salvo tiradas de tamaño variable). */
export interface EngineSpread extends Omit<Spread, 'description'> {
  description: string | null;
  minSize: number | null;
}
/** GET /provinces: el API añade `zona` y `gentilicio` (crudo, «sevillano/a»); `teaser` puede ser null. */
export interface EngineProvince extends Omit<ProvinceInfo, 'teaser' | 'gentilicio' | 'comunidad'> {
  comunidad: string | null;
  gentilicio: string | null;
  zona: string | null;
  teaser: string | null;
}

// ---------------------------------------------------------------- modelo de contenido (content/)

export interface CardDef {
  id: string;
  arcana: 'major' | 'minor';
  number?: number;
  suit?: string;
  rank?: string;
  court?: boolean;
  only48?: boolean;
}
export interface DeckModelDef {
  id: string;
  deckSize?: number;
  art?: string;
  minors?: string;
  pattern?: string;
  numerals?: Record<string, string>;
  reversedProbability?: number;
}
export interface DeckDef {
  family: string;
  reversedProbability?: number;
  defaultModel: string;
  models: DeckModelDef[];
  cards: CardDef[];
}
export interface SpreadDef {
  id: string;
  size?: number;
  minSize?: number;
  families: string[];
  positions: string[];
  layout: string;
  order?: number;
  phase?: number;
}
export interface ProvinceDef {
  code: string;
  nombre: string;
  nombreOficial?: string;
  comunidad: string | null;
  capital?: string | null;
  zona?: string;
}
export interface ProvinceSheet {
  code: string;
  nombre: string;
  comunidad: string;
  gentilicio: string;
  plato: string[];
  fiesta: string[];
  clima: string[];
  chascarrillos: string[];
}
export interface CardsI18n {
  family?: string;
  name?: string;
  description?: string;
  suits: Record<string, { name?: string; description?: string }>;
  models: Record<string, { name?: string; description?: string; cardNames?: Record<string, string> }>;
  cards: Record<string, string>;
}
export interface SpreadI18n {
  name?: string;
  short?: string;
  description?: string;
  positions: Record<string, { label?: string; inline?: string; hint?: string }>;
}
export interface Meaning {
  keywords: string[];
  upright: Record<string, string[]>;
  reversed: Record<string, string[]>;
}
export interface When {
  tema?: string[];
  invertida?: boolean;
  arcana?: string;
  cardIds?: string[];
  suit?: string[];
  family?: string[];
  spread?: string[];
  posicion?: string[];
  decadaMin?: number;
  decadaMax?: number;
  horaMin?: number;
  horaMax?: number;
  mayoresMin?: number;
  figurasMin?: number;
  suitDominante?: string;
  provincia?: string[];
  signo?: string[];
  diaSemana?: number[];
  faseLunar?: string[];
  estacion?: string[];
  primeraCarta?: boolean;
  ultimaCarta?: boolean;
}
export interface Fragment {
  id: string;
  slot: string;
  tones: string[];
  weight?: number;
  when?: When | null;
  text: string;
}
export interface InteractionDef {
  id: string;
  tones: string[];
  weight?: number;
  when?: When | null;
  prompt: string;
  branches: { si: string; no: string; skip: string };
}
export interface PendulumModelDef {
  nombre?: string;
  personalidad?: string;
  lines: Record<string, string[]>;
}
export interface ChakraDef {
  id: string;
  nombre: string;
  informes: string[];
}
export interface PendulumDef {
  lines: Record<string, string[]>;
  models: Record<string, PendulumModelDef>;
  ouijaWords: string[];
  chakras: ChakraDef[];
}
export interface LuckyColor {
  name: string;
  hex: string;
}
export interface ServerLabels {
  signos: Record<string, string>;
  dias: Record<string, string>;
  estaciones: Record<string, string>;
  fasesLunares: Record<string, string>;
  tonos: Record<string, string>;
  temas: Record<string, string>;
  respuestas: Record<string, string>;
  luckyColors: LuckyColor[];
  disclaimer: string | null;
  disclaimerSalud: string | null;
  saludFallback: string | null;
  provinciaExtranjero: string | null;
  provinciaDesconocida: string | null;
}
