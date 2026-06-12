/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, LocationInfo, Suit, CardBackStyle, TableColorStyle, DragState } from '../types';
import { CardComponent } from './CardComponent';
import { isValidMove } from '../utils/solitaireLogic';

interface BoardProps {
  stock: Card[];
  waste: Card[];
  foundations: Record<Suit, Card[]>;
  tableau: Card[][];
  selectedLoc: LocationInfo | null;
  onSelectLoc: (loc: LocationInfo, e: React.MouseEvent) => void;
  onDoubleClickCard: (loc: LocationInfo, e: React.MouseEvent) => void;
  onDrawCard: () => void;
  onPileClick: (target: LocationInfo) => void;
  onMoveCards: (source: LocationInfo, target: LocationInfo) => void;
  cardBack: CardBackStyle;
  tableColor: TableColorStyle;
  dragState: DragState | null;
  onDragStartPointer: (location: LocationInfo, rect: DOMRect, clientX: number, clientY: number) => void;
  drawCount: 1 | 3;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_WATERMARKS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const TABLE_BACKGROUNDS: Record<TableColorStyle, string> = {
  'classic-green': 'bg-[#00a86b]', // Authentic bright retro Solitaire green felt matching the user's uploaded image
  'deep-emerald': 'bg-[#0f2d1d]',  // Luxuriously deep forest green
  'royal-blue': 'bg-[#0b1b3d]',   // Deep comfortable cobalt blue
  'vegas-red': 'bg-[#5c0f1b]',     // Premium poker table red
  'charcoal-gray': 'bg-[#1c1917]', // Minimalist dark charcoal
};

const getRetroDitherStyle = (color: TableColorStyle): React.CSSProperties => {
  let dotColor = '#007a4d'; // For classic-green (#00a86b)
  if (color === 'deep-emerald') dotColor = '#081a10';
  else if (color === 'royal-blue') dotColor = '#050d21';
  else if (color === 'vegas-red') dotColor = '#3d070f';
  else if (color === 'charcoal-gray') dotColor = '#110f0e';

  return {
    backgroundImage: `radial-gradient(${dotColor} 25%, transparent 25%), radial-gradient(${dotColor} 25%, transparent 25%)`,
    backgroundSize: '4px 4px',
    backgroundPosition: '0 0, 2px 2px',
    border: '1.5px solid rgba(0, 0, 0, 0.55)',
    borderRadius: '3px',
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Subtle contrast overlay inside empty slots
  };
};

export const Board: React.FC<BoardProps> = ({
  stock,
  waste,
  foundations,
  tableau,
  selectedLoc,
  onSelectLoc,
  onDoubleClickCard,
  onDrawCard,
  onPileClick,
  onMoveCards,
  cardBack,
  tableColor,
  dragState,
  onDragStartPointer,
  drawCount,
}) => {
  const tableBg = TABLE_BACKGROUNDS[tableColor] || TABLE_BACKGROUNDS['classic-green'];
  const [hoveredCard, setHoveredCard] = React.useState<{ colIdx: number; cardIdx: number } | null>(null);

  // helper to get the card currently selected
  const getSelectedCard = (): Card | null => {
    if (!selectedLoc) return null;
    if (selectedLoc.type === 'stock') {
      return stock[selectedLoc.cardIdx!] || null;
    }
    if (selectedLoc.type === 'waste') {
      return waste[selectedLoc.cardIdx!] || null;
    }
    if (selectedLoc.type === 'foundation' && selectedLoc.suit) {
      const pile = foundations[selectedLoc.suit];
      return pile[selectedLoc.cardIdx!] || null;
    }
    if (selectedLoc.type === 'tableau' && selectedLoc.idx !== undefined) {
      const pile = tableau[selectedLoc.idx];
      return pile[selectedLoc.cardIdx!] || null;
    }
    return null;
  };

  const selectedCard = getSelectedCard();

  const isMoveValid = (targetType: 'tableau' | 'foundation', indexOrSuit: number | Suit): boolean => {
    if (!selectedCard) return false;
    
    if (targetType === 'tableau') {
      const colIdx = indexOrSuit as number;
      if (selectedLoc?.type === 'tableau' && selectedLoc.idx === colIdx) return false;
      return isValidMove(selectedCard, { type: 'tableau', idx: colIdx }, foundations, tableau);
    } else {
      const suit = indexOrSuit as Suit;
      if (selectedLoc?.type === 'foundation' && selectedLoc.suit === suit) return false;
      
      // Para fundações, apenas a carta do topo absoluto do monte original pode ser movida
      if (selectedLoc?.type === 'tableau' && selectedLoc.idx !== undefined) {
        const col = tableau[selectedLoc.idx];
        if (selectedLoc.cardIdx !== col.length - 1) return false;
      }
      
      return isValidMove(selectedCard, { type: 'foundation', suit }, foundations, tableau);
    }
  };

  const checkIsDragGhost = (loc: LocationInfo) => {
    if (!dragState) return false;
    const { source } = dragState;
    if (source.type !== loc.type) return false;
    
    if (source.type === 'tableau' && loc.type === 'tableau') {
      return source.idx === loc.idx && (loc.cardIdx !== undefined && loc.cardIdx >= source.cardIdx!);
    }
    
    if (source.type === 'waste' && loc.type === 'waste') {
      return source.cardIdx === loc.cardIdx;
    }
    
    if (source.type === 'foundation' && loc.type === 'foundation') {
      return source.suit === loc.suit && source.cardIdx === loc.cardIdx;
    }
    
    return false;
  };

  // Handler for HTML5 Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handler for HTML5 Drop on piles/foundations
  const handleDrop = (e: React.DragEvent, target: LocationInfo) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const source = JSON.parse(dataStr) as LocationInfo;
        onMoveCards(source, target);
      }
    } catch (err) {
      console.error('Failed to parse drag-and-drop source:', err);
    }
  };

  // Determine standard cascading offsets to avoid vertically spilling out of viewports on smaller screens
  const getTableauOffset = (cardCount: number) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (cardCount > 10) return 6;
      if (cardCount > 6) return 9;
      return 12;
    } else {
      if (cardCount > 12) return 14;
      if (cardCount > 8) return 18;
      if (cardCount > 6) return 22;
      return 26;
    }
  };

  return (
    <div 
      className={`relative flex-grow p-2 sm:p-5 flex flex-col gap-4 sm:gap-6 ${tableBg} transition-all duration-300 overflow-y-auto select-none`}
      style={{ minHeight: 0 }}
    >
      {/* Top Stack Row (Stock, Waste, Filler, Foundations) */}
      <div className="flex justify-between items-start gap-1 sm:gap-4 shrink-0 max-w-5xl mx-auto w-full">
        <div className="flex gap-2 sm:gap-4">
          {/* Stock Pile Slot */}
          <div 
            onClick={onDrawCard}
            className="w-[44px] h-[68px] md:w-[85px] md:h-[125px] relative flex items-center justify-center cursor-pointer select-none border border-black/30 rounded-[3px]"
            style={stock.length === 0 ? getRetroDitherStyle(tableColor) : undefined}
          >
            {stock.length > 0 ? (
              <CardComponent
                card={stock[stock.length - 1]}
                location={{ type: 'stock', cardIdx: stock.length - 1 }}
                isSelected={false}
                onSelect={onDrawCard}
                onDoubleClick={onDoubleClickCard}
                backStyle={cardBack}
                className="absolute top-0 left-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center select-none text-black/55 hover:text-black/80 transition-colors w-full h-full font-bold">
                <span className="text-[20px] md:text-[38px] leading-none select-none">↺</span>
              </div>
            )}
          </div>

          {/* Waste Pile Slot */}
          <div 
            onClick={() => onPileClick({ type: 'waste' })}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, { type: 'waste' })}
            data-drag-target={JSON.stringify({ type: 'waste' })}
            className="w-[44px] h-[68px] md:w-[85px] md:h-[125px] rounded-[5px] border border-white/10 bg-black/15 relative shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]"
            style={{
              marginRight: drawCount === 3 && waste.length > 1 ? (window.innerWidth <= 768 ? '24px' : '44px') : '0px',
              transition: 'margin 0.15s ease',
            }}
          >
            {waste.length > 0 && (() => {
              const N = waste.length;
              const topCount = drawCount === 3 ? Math.min(3, N) : 1;
              const startFannedIdx = N - topCount;
              
              return waste.map((card, globalIdx) => {
                const isTopCard = globalIdx === N - 1;
                const isMobile = window.innerWidth <= 768;
                const fanOffset = isMobile ? 12 : 20;
                
                let fannedPositionIndex = 0;
                if (drawCount === 3) {
                  if (globalIdx >= startFannedIdx) {
                    fannedPositionIndex = globalIdx - startFannedIdx;
                  }
                }
                
                const leftPos = fannedPositionIndex * fanOffset;

                return (
                  <CardComponent
                    key={card.id}
                    card={card}
                    location={{ type: 'waste', cardIdx: globalIdx }}
                    isSelected={selectedLoc?.type === 'waste' && selectedLoc?.cardIdx === globalIdx}
                    onSelect={isTopCard ? onSelectLoc : undefined}
                    onDoubleClick={isTopCard ? onDoubleClickCard : undefined}
                    backStyle={cardBack}
                    onDragStartPointer={isTopCard ? onDragStartPointer : undefined}
                    isDragGhost={checkIsDragGhost({ type: 'waste', cardIdx: globalIdx })}
                    animateFromStock={globalIdx >= startFannedIdx}
                    staggerIndex={fannedPositionIndex}
                    className="absolute top-0 left-0"
                    style={{
                      position: 'absolute',
                      left: `${leftPos}px`,
                      zIndex: 10 + globalIdx,
                      pointerEvents: isTopCard ? 'auto' : 'none',
                    }}
                  />
                );
              });
            })()}
          </div>
        </div>

        {/* Centered Spacing Filler */}
        <div className="flex-grow max-w-sm hidden md:block" />

        {/* Foundations (4 suit piles) */}
        <div className="flex gap-2 sm:gap-4 md:basis-auto">
          {SUITS.map((suit) => {
            const pile = foundations[suit];
            const hasCards = pile.length > 0;
            const isRed = suit === 'hearts' || suit === 'diamonds';
            const isValidDrop = isMoveValid('foundation', suit);

            return (
              <div 
                key={suit}
                onClick={() => onPileClick({ type: 'foundation', suit })}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, { type: 'foundation', suit })}
                data-suit={suit}
                data-drag-target={JSON.stringify({ type: 'foundation', suit })}
                className={`relative w-[44px] h-[68px] md:w-[85px] md:h-[125px] flex flex-col items-center justify-center select-none cursor-pointer transition-all ${
                  isValidDrop 
                    ? 'border-2 border-yellow-400 bg-yellow-400/20 scale-[1.02] z-30 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                    : 'border border-black/35'
                }`}
                style={!hasCards ? getRetroDitherStyle(tableColor) : { borderRadius: '3px' }}
              >
                {/* Visual Suit Watermark - only shown if we want a classic subtle hint, but very faint */}
                {!hasCards && (
                  <div 
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans font-bold leading-none text-center select-none pointer-events-none opacity-[0.25] ${
                      isRed ? 'text-red-900/40' : 'text-neutral-900/40'
                    }`}
                    style={{ fontSize: window.innerWidth <= 768 ? '22px' : '44px' }}
                  >
                    {SUIT_WATERMARKS[suit]}
                  </div>
                )}

                {/* Draw Stack Cards inside Foundation */}
                {hasCards && (
                  <CardComponent
                    card={pile[pile.length - 1]}
                    location={{ type: 'foundation', suit, cardIdx: pile.length - 1 }}
                    isSelected={selectedLoc?.type === 'foundation' && selectedLoc?.suit === suit}
                    onSelect={onSelectLoc}
                    onDoubleClick={onDoubleClickCard}
                    backStyle={cardBack}
                    onDragStartPointer={onDragStartPointer}
                    isDragGhost={checkIsDragGhost({ type: 'foundation', suit, cardIdx: pile.length - 1 })}
                    className={`absolute top-0 left-0 ${
                      isValidDrop ? 'ring-2 ring-yellow-400 z-40' : ''
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Tableau (7 columns) */}
      <div className="flex justify-between gap-1 sm:gap-4 flex-grow max-w-5xl mx-auto w-full select-none" style={{ minHeight: '300px' }}>
        {tableau.map((pile, colIdx) => {
          const cascadeOffset = getTableauOffset(pile.length);
          const isValidDropTarget = isMoveValid('tableau', colIdx);

          return (
            <div 
              key={colIdx}
              onClick={() => onPileClick({ type: 'tableau', idx: colIdx })}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, { type: 'tableau', idx: colIdx })}
              data-drag-target={JSON.stringify({ type: 'tableau', idx: colIdx })}
              className="relative flex-grow flex flex-col select-none rounded-[3px] min-h-[150px] bg-white/2 hover:bg-white/5 cursor-pointer max-w-[85px]"
              style={{ width: window.innerWidth <= 768 ? '44px' : '85px' }}
            >
              {/* Empty pile placeholder outline */}
              {pile.length === 0 && (
                <div 
                  className={`w-full h-[68px] md:h-[125px] flex items-center justify-center transition-all ${
                    isValidDropTarget 
                      ? 'border-2 border-yellow-400 scale-[1.02] z-30' 
                      : 'border border-black/15'
                  }`}
                  style={getRetroDitherStyle(tableColor)}
                >
                  <span className={`text-[12px] md:text-xl font-bold font-sans text-neutral-800/40 select-none ${isValidDropTarget ? 'text-yellow-600 font-extrabold scale-110' : ''}`}>K</span>
                </div>
              )}

              {/* Render Cascading Stack */}
              {pile.map((card, cardIdx) => {
                const isMobile = window.innerWidth <= 768;
                let extraShift = 0;

                // Only apply dynamic spread offset if we're not actively dragging cards
                if (!dragState) {
                  // If someone hovers a card in this column, shift all cards stacked beneath it
                  if (hoveredCard && hoveredCard.colIdx === colIdx && cardIdx > hoveredCard.cardIdx) {
                    extraShift += isMobile ? 18 : 36;
                  }
                  // If a card is selected in this column, keep the sub-stack beneath it fully separated for readability
                  if (selectedLoc && selectedLoc.type === 'tableau' && selectedLoc.idx === colIdx && cardIdx > selectedLoc.cardIdx!) {
                    extraShift += isMobile ? 24 : 48;
                  }
                }

                const topOffset = (cardIdx * cascadeOffset) + extraShift;
                const isLastCard = cardIdx === pile.length - 1;
                const isTargetGlow = isValidDropTarget && isLastCard;
                
                return (
                  <CardComponent
                    key={card.id}
                    card={card}
                    location={{ type: 'tableau', idx: colIdx, cardIdx }}
                    isSelected={
                      selectedLoc?.type === 'tableau' && 
                      selectedLoc?.idx === colIdx && 
                      selectedLoc?.cardIdx === cardIdx
                    }
                    onSelect={onSelectLoc}
                    onDoubleClick={onDoubleClickCard}
                    backStyle={cardBack}
                    onDragStartPointer={onDragStartPointer}
                    isDragGhost={checkIsDragGhost({ type: 'tableau', idx: colIdx, cardIdx })}
                    onMouseEnter={() => {
                      if (card.isFaceUp) {
                        setHoveredCard({ colIdx, cardIdx });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCard(null);
                    }}
                    className={isTargetGlow ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-green-800 shadow-[0_0_12px_rgba(251,191,36,0.95)] animate-pulse z-40' : ''}
                    style={{
                      position: 'absolute',
                      top: `${topOffset}px`,
                      left: '0px',
                      zIndex: cardIdx + 10,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
