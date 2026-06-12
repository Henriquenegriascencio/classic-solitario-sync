/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, Suit, LocationInfo } from '../types';

export function generateDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];

  suits.forEach((suit) => {
    const color = (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
    for (let value = 1; value <= 13; value++) {
      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
        isFaceUp: false,
        color,
      });
    }
  });

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface DealResult {
  stock: Card[];
  waste: Card[];
  tableau: Card[][];
  foundations: Record<Suit, Card[]>;
}

export function dealGame(): DealResult {
  const fullDeck = shuffleDeck(generateDeck());
  const tableau: Card[][] = Array.from({ length: 7 }, () => []);
  const foundations: Record<Suit, Card[]> = {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  };

  // Distribuir para o Tableau
  let deckIndex = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = fullDeck[deckIndex++];
      if (row === col) {
        card.isFaceUp = true;
      }
      tableau[col].push(card);
    }
  }

  // O restante vai para o Stock
  const stock = fullDeck.slice(deckIndex).map(c => {
    c.isFaceUp = false;
    return c;
  });

  return {
    tableau,
    stock,
    waste: [],
    foundations,
  };
}

/**
 * Valida se um movimento e valido de acordo com as regras de Klondike Solitaire.
 * card: A primeira carta que esta a ser movida
 * target: Destino do movimento
 */
export function isValidMove(
  card: Card,
  target: LocationInfo,
  foundations: Record<Suit, Card[]>,
  tableau: Card[][]
): boolean {
  if (target.type === 'tableau') {
    const colIdx = target.idx as number;
    const destCol = tableau[colIdx];

    if (destCol.length === 0) {
      // Epaco vazio do tableau aceita apenas Reis (K = 13)
      return card.value === 13;
    }

    // Coluna nao vazia: cor diferente e valor decrescente (ex: 9 Vermelho sobre 10 Preto)
    const topCard = destCol[destCol.length - 1];
    return topCard.isFaceUp && card.color !== topCard.color && card.value === topCard.value - 1;
  }

  if (target.type === 'foundation') {
    const suit = target.suit as Suit;
    // Carta deve pertencer a mesma fundacao
    if (card.suit !== suit) return false;

    const destPile = foundations[suit];
    if (destPile.length === 0) {
      // Pilha vazia aceita apenas As (A = 1)
      return card.value === 1;
    }

    // Pilha com cartas: mesmo naipe e valor incremental (ex: 4 sobre 3)
    const topCard = destPile[destPile.length - 1];
    return card.value === topCard.value + 1;
  }

  return false;
}

/**
 * Procura um destino valido automatico (Fast-Move) para a carta clicada ou double-clicada.
 * Retorna LocationInfo se encontrar destino, caso contrario null.
 */
export function findAutoMove(
  card: Card,
  source: LocationInfo,
  foundations: Record<Suit, Card[]>,
  tableau: Card[][]
): LocationInfo | null {
  // 1. Tentar primeiro as Fundacoes (prioridade maxima)
  const targetFoundation: LocationInfo = { type: 'foundation', suit: card.suit };
  if (isValidMove(card, targetFoundation, foundations, tableau)) {
    // Validar se e a carta do topo antes de mover (se for tableau, so pode se for a ultima da coluna)
    if (source.type === 'tableau') {
      const col = tableau[source.idx!];
      if (source.cardIdx === col.length - 1) {
        return targetFoundation;
      }
    } else if (source.type === 'waste') {
      return targetFoundation;
    }
  }

  // 2. Tentar o Tableau
  for (let colIdx = 0; colIdx < 7; colIdx++) {
    // Evitar mover do tableau para si mesmo ou para colunas vazias se ja for a carta base do monte
    if (source.type === 'tableau' && source.idx === colIdx) continue;
    
    // Se a carta ja e a base de uma coluna (primeira carta face-up encima de cartas ocultas),
    // nao faz sentido move-la para outra coluna vazia (mudar 13 de sitio para outro sitio igual)
    const pile = tableau[colIdx];
    if (pile.length === 0 && card.value === 13 && source.type === 'tableau' && source.cardIdx === 0) {
      continue;
    }

    const targetTableau: LocationInfo = { type: 'tableau', idx: colIdx };
    if (isValidMove(card, targetTableau, foundations, tableau)) {
      return targetTableau;
    }
  }

  return null;
}

/**
 * Se todas as cartas no stock e waste estiverem vazias, 
 * e todas as cartas do tableau estiverem reveladas (nenhuma oculta),
 * o jogo pode ser auto-completado com seguranca.
 */
export function checkCanAutoComplete(
  stock: Card[],
  waste: Card[],
  tableau: Card[][]
): boolean {
  // Deve ter stock e waste vazios
  if (stock.length > 0 || waste.length > 0) return false;

  // Todas as cartas no tableau devem estar de face para cima
  for (let i = 0; i < 7; i++) {
    const pile = tableau[i];
    for (const card of pile) {
      if (!card.isFaceUp) return false;
    }
  }

  // E deve haver cartas jogaveis no tabuleiro (se tudo ja estiver nas fundacoes nao precisa auto-completar)
  const tableauCount = tableau.reduce((acc, p) => acc + p.length, 0);
  return tableauCount > 0;
}

/**
 * Retorna o proximo passo automatico de autocomplete.
 * Encontra a menor carta do tableau que pode ser movida para a fundacao.
 */
export function getNextAutoCompleteStep(
  foundations: Record<Suit, Card[]>,
  tableau: Card[][]
): { source: LocationInfo; target: LocationInfo } | null {
  for (let colIdx = 0; colIdx < 7; colIdx++) {
    const pile = tableau[colIdx];
    if (pile.length === 0) continue;

    const topCard = pile[pile.length - 1];
    const targetFoundation: LocationInfo = { type: 'foundation', suit: topCard.suit };

    if (isValidMove(topCard, targetFoundation, foundations, tableau)) {
      return {
        source: { type: 'tableau', idx: colIdx, cardIdx: pile.length - 1 },
        target: targetFoundation
      };
    }
  }
  return null;
}

/**
 * Verifica se o jogador ficou sem movimentos (Derrota).
 */
export function checkHasMoviesLeft(
  stock: Card[],
  waste: Card[],
  tableau: Card[][],
  foundations: Record<Suit, Card[]>
): boolean {
  // 1. Testar se o Stock ou o Waste contem movimentos validos
  // Se ainda ha cartas no stock ou waste, e possivel comprar ou reciclar, portanto ha movimentos
  if (stock.length > 0 || waste.length > 0) return true;

  // Se houver cartas no Waste, ver se o topo pode mover
  if (waste.length > 0) {
    const topWaste = waste[waste.length - 1];
    // Tentar fudaçoes
    if (isValidMove(topWaste, { type: 'foundation', suit: topWaste.suit }, foundations, tableau)) return true;
    // Tentar tableau
    for (let c = 0; c < 7; c++) {
      if (isValidMove(topWaste, { type: 'tableau', idx: c }, foundations, tableau)) return true;
    }
  }

  // 2. Analisar as cartas reveladas das colunas do Tableau
  for (let i = 0; i < 7; i++) {
    const pile = tableau[i];
    if (pile.length === 0) continue;

    // Detetar a primeira carta virada de face para cima na coluna
    const firstFaceUpIdx = pile.findIndex((c) => c.isFaceUp);
    if (firstFaceUpIdx === -1) continue;

    const subCard = pile[firstFaceUpIdx];

    // Se nao for a base real da coluna, vale a pena mover para coluna vazia?
    // Mover um Rei que ja comeca uma coluna para outra coluna vazia nao abre novos caminhos,
    // mas se houver cartas ocultas atras, sim.
    const hasFaceDownCardsBehind = firstFaceUpIdx > 0;

    // Verificar se a pilha pode ser movida para outra coluna do tableau
    for (let j = 0; j < 7; j++) {
      if (i === j) continue;
      
      const targetPile = tableau[j];
      if (targetPile.length === 0) {
        // Se a coluna destino estiver vazia, so vale a pena mover se a carta for Rei e houver cartas ocultas atras de si
        if (subCard.value === 13 && hasFaceDownCardsBehind) {
          return true;
        }
      } else {
        if (isValidMove(subCard, { type: 'tableau', idx: j }, foundations, tableau)) return true;
      }
    }

    // Verificar se o topo desta coluna pode ir para as fundacoes
    const topCard = pile[pile.length - 1];
    if (isValidMove(topCard, { type: 'foundation', suit: topCard.suit }, foundations, tableau)) {
      return true;
    }
  }

  return false;
}
