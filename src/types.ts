/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = number; // 1 (As) ate 13 (Rei)

export interface Card {
  id: string; // Id unico para renderizacao ideal
  suit: Suit;
  value: CardValue;
  isFaceUp: boolean;
  color: 'red' | 'black';
}

export type LocationType = 'stock' | 'waste' | 'tableau' | 'foundation';

export interface LocationInfo {
  type: LocationType;
  idx?: number; // Pilha do Tableau (0 a 6)
  suit?: Suit;  // Pilha da Fundacao
  cardIdx?: number; // Indice da carta na pilha
}

export interface HistoryState {
  score: number;
  movesCount: number;
  stock: Card[];
  waste: Card[];
  foundations: Record<Suit, Card[]>;
  tableau: Card[][];
}

export interface GameStats {
  played: number;
  won: number;
  bestTime: number; // em segundos
  bestScore: number;
  streak: number;
}

export type CardBackStyle = 'classic-blue' | 'classic-red' | 'fish-sea' | 'palm-sunset' | 'castle-gold' | 'neon-grid';
export type TableColorStyle = 'classic-green' | 'deep-emerald' | 'royal-blue' | 'vegas-red' | 'charcoal-gray';

export type MusicType = 'chiptune_classic' | 'retro_wave' | 'nostalgia_cantabile' | 'gamer_anthem';

export interface GameConfig {
  drawCount: 1 | 3;
  cardBack: CardBackStyle;
  tableColor: TableColorStyle;
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicType?: MusicType;
  soundVolume?: number; // 0 to 100
  musicVolume?: number; // 0 to 100
}

export interface DragState {
  source: LocationInfo;
  cards: Card[];
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  rectLeft: number;
  rectTop: number;
}

