/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Card, LocationInfo, CardBackStyle, Suit } from '../types';

interface CardComponentProps {
  card: Card;
  location: LocationInfo;
  isSelected: boolean;
  onSelect: (loc: LocationInfo, e: React.MouseEvent) => void;
  onDoubleClick: (loc: LocationInfo, e: React.MouseEvent) => void;
  backStyle: CardBackStyle;
  style?: React.CSSProperties;
  className?: string;
  isDraggingElsewhere?: boolean;
  isDragGhost?: boolean;
  onDragStartPointer?: (location: LocationInfo, rect: DOMRect, clientX: number, clientY: number) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  animateFromStock?: boolean;
  staggerIndex?: number;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  location,
  isSelected,
  onSelect,
  onDoubleClick,
  backStyle,
  style,
  className = '',
  isDraggingElsewhere = false,
  isDragGhost = false,
  onDragStartPointer,
  onMouseEnter,
  onMouseLeave,
  animateFromStock = false,
  staggerIndex,
}) => {
  const getLabel = (val: number) => {
    if (val === 1) return 'A';
    if (val === 11) return 'J';
    if (val === 12) return 'Q';
    if (val === 13) return 'K';
    return val.toString();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (!card.isFaceUp) return;

    if (onDragStartPointer) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      onDragStartPointer(location, rect, e.clientX, e.clientY);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(location, e);
  };

  const handleDblClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(location, e);
  };

  // Modern vibrant primary suit colors for high fidelity
  const colorClass = card.color === 'red' ? 'text-rose-600' : 'text-zinc-900';

  // Beautiful modern high-fidelity minimalist line art for J, Q, K
  const renderFacePortrait = (val: number, suit: Suit) => {
    const isRed = suit === 'hearts' || suit === 'diamonds';
    
    // JACK: Sleek geometric profile prince with cap and clean curves
    if (val === 11) {
      return (
        <svg viewBox="0 0 24 32" className="w-full h-full" shapeRendering="geometricPrecision">
          <rect width="24" height="32" rx="1.5" fill="#fbfbfa" />
          <rect x="1.5" y="1.5" width="21" height="29" rx="1" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          {/* Hair curls */}
          <path d="M 6,10 C 6,7 18,7 18,10 C 18,14 17,21 16,21 C 15,21 15,12 12,12 C 9,12 8,21 7,21 C 6,21 6,14 6,10 Z" fill="#f59e0b" />
          {/* Face skin */}
          <path d="M 8,11 H 16 V 18 C 16,20 14,21 12,21 C 10,21 8,20 8,18 Z" fill="#ffedd5" />
          {/* Cap */}
          <path d="M 6,10 C 6,6 18,6 18,10 Z" fill="#3b82f6" />
          <path d="M 12,3 Q 11,8 14,10" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /> {/* feather */}
          {/* Eye, blush, smile */}
          <circle cx="10.5" cy="13.5" r="0.75" fill="#1e293b" />
          <circle cx="13.5" cy="13.5" r="0.75" fill="#1e293b" />
          <path d="M 10.5,16.5 Q 12,18 13.5,16.5" fill="none" stroke="#e11d48" strokeWidth="0.75" strokeLinecap="round" />
          {/* Robe/Armor */}
          <path d="M 5,21 H 19 L 20,30 H 4 Z" fill="#ef4444" />
          {/* Collar ornament */}
          <path d="M 8,21 L 12,25 L 16,21" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    
    // QUEEN: Queen looking slightly side-wards with curly golden hair and holding a rose
    if (val === 12) {
      return (
        <svg viewBox="0 0 24 32" className="w-full h-full" shapeRendering="geometricPrecision">
          <rect width="24" height="32" rx="1.5" fill="#fbfbfa" />
          <rect x="1.5" y="1.5" width="21" height="29" rx="1" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          {/* Hair locks */}
          <path d="M 5,11 C 5,8 19,8 19,11 C 19,14 18,22 17,22 C 16,22 15,13 12,13 C 9,13 8,22 7,22 C 6,22 5,14 5,11 Z" fill="#d97706" />
          {/* Face skin */}
          <path d="M 8,12 H 16 V 19 C 16,21 14,22 12,22 C 10,22 8,21 8,19 Z" fill="#ffedd5" />
          {/* Golden crown with red rubies */}
          <path d="M 7,12 L 8,7 L 12,10 L 16,7 L 17,12 Z" fill="#f59e0b" />
          <circle cx="8" cy="6" r="0.6" fill="#ef4444" />
          <circle cx="12" cy="9" r="0.6" fill="#ef4444" />
          <circle cx="16" cy="6" r="0.6" fill="#ef4444" />
          {/* Eyes & lips */}
          <circle cx="10.5" cy="14.5" r="0.75" fill="#1e293b" />
          <circle cx="13.5" cy="14.5" r="0.75" fill="#1e293b" />
          <path d="M 11,17.5 Q 12,18.5 13,17.5" fill="none" stroke="#e11d48" strokeWidth="0.75" strokeLinecap="round" />
          {/* Royal robe */}
          <path d="M 4,22 H 20 L 21,30 H 3 Z" fill="#8b5cf6" />
          {/* Flower */}
          <path d="M 11,23 C 10,23 9,24 9,25 C 9,26 10,27 12,27 C 14,27 15,26 15,25 C 15,24 14,23 13,23 Z" fill="#ef4444" />
          <path d="M 12,27 L 12,30" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }
    
    // KING: Old majestic king with sword and cape
    if (val === 13) {
      return (
        <svg viewBox="0 0 24 32" className="w-full h-full" shapeRendering="geometricPrecision">
          <rect width="24" height="32" rx="1.5" fill="#fbfbfa" />
          <rect x="1.5" y="1.5" width="21" height="29" rx="1" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          {/* Stately grey hair and beard */}
          <path d="M 5,11 C 5,7 19,7 19,11 C 19,15 18,22 17,22 C 16,22 15,13 12,13 C 9,13 8,22 7,22 C 6,22 5,15 5,11 Z" fill="#94a3b8" />
          <path d="M 7,18 C 7,23 17,23 17,18 Z" fill="#cbd5e1" />
          {/* Face skin */}
          <path d="M 8,11 H 16 V 17 C 16,19 14,20 12,20 C 10,20 8,19 8,17 Z" fill="#ffedd5" />
          {/* Crown */}
          <path d="M 7,11 H 17 L 16,6 L 12,8.5 L 8,6 Z" fill="#f59e0b" />
          {/* Eyes & mouth */}
          <circle cx="10.5" cy="13.5" r="0.75" fill="#1e293b" />
          <circle cx="13.5" cy="13.5" r="0.75" fill="#1e293b" />
          <path d="M 10.5,15.5 H 13.5" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
          {/* Royal robe */}
          <path d="M 4,21 H 20 L 21,30 H 3 Z" fill="#1e1b4b" />
          {/* Golden collar */}
          <path d="M 6,21 C 6,21 12,25 18,21" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Sword hilt */}
          <path d="M 11,22 L 13,22 M 12,21 L 12,29" fill="none" stroke="#ebd21c" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }

    return null;
  };

  // High-fidelity beautifully styled vector playing card backs
  const renderCardBack = () => {
    switch (backStyle) {
      case 'classic-red':
        return (
          <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
            <defs>
              <pattern id="retro-red-mesh" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#ffffff" />
                <path d="M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6" stroke="#b91c1c" strokeWidth="1.8" />
                <path d="M0,0 L8,8 M-2,6 L6,-2 M2,10 L10,2" stroke="#fca5a5" strokeWidth="1.0" strokeOpacity="0.8" />
                <circle cx="4" cy="4" r="0.8" fill="#b91c1c" />
              </pattern>
            </defs>
            <rect width="54" height="80" rx="2.5" fill="#ffffff" />
            <rect x="2.5" y="2.5" width="49" height="75" rx="1.5" fill="none" stroke="#000000" strokeWidth="1" />
            {/* The signature retro red weave pattern body */}
            <rect x="4" y="4" width="46" height="72" rx="1" fill="url(#retro-red-mesh)" stroke="#000000" strokeWidth="0.5" />
          </svg>
        );

      case 'fish-sea':
        return (
          <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
            <defs>
              <linearGradient id="sea-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
            <rect width="54" height="80" rx="3.5" fill="url(#sea-grad)" />
            <rect x="2.5" y="2.5" width="49" height="75" rx="3" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.85" />
            {/* Organic seaweed background */}
            <path d="M 4,76 C 8,62 14,64 12,45 C 10,26 22,24 24,4 Q 28,45 42,76 Z" fill="#38bdf8" fillOpacity="0.15" />
            <path d="M 12,76 C 18,52 32,58 26,35 C 20,12 36,12 38,4 Q 40,38 50,76 Z" fill="#34d399" fillOpacity="0.1" />
            {/* Elegant bubble dots */}
            <circle cx="15" cy="46" r="2" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="18" cy="28" r="1" fill="#ffffff" fillOpacity="0.5" />
            <circle cx="38" cy="52" r="2.5" fill="#ffffff" fillOpacity="0.3" />
            <circle cx="41" cy="22" r="1.5" fill="#ffffff" fillOpacity="0.4" />
            {/* Sleek stylized tropical fish */}
            <path d="M 10,36 C 18,27 28,34 34,37 L 39,32 L 38,44 L 34,37 Z" fill="#34d399" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="16" cy="34" r="1.1" fill="#1e293b" />
            {/* Smaller fish */}
            <path d="M 44,52 C 38,45 31,50 27,52 L 23,48 L 24,57 L 27,52 Z" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx="40" cy="51" r="0.8" fill="#1e293b" />
          </svg>
        );

      case 'palm-sunset':
        return (
          <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
            <defs>
              <linearGradient id="sunset-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#312e81" />
                <stop offset="35%" stopColor="#4c1d95" />
                <stop offset="65%" stopColor="#831843" />
                <stop offset="100%" stopColor="#db2777" />
              </linearGradient>
            </defs>
            <rect width="54" height="80" rx="3.5" fill="url(#sunset-grad)" />
            <rect x="2.5" y="2.5" width="49" height="75" rx="3" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" />
            
            {/* Shining Sun */}
            <circle cx="40" cy="28" r="9.5" fill="#f59e0b" opacity="0.6" />
            <circle cx="40" cy="28" r="7.5" fill="#fef08a" stroke="#1e293b" strokeWidth="0.4" />
            <circle cx="37" cy="27" r="0.8" fill="#1e293b" />
            <circle cx="43" cy="27" r="0.8" fill="#1e293b" />
            <path d="M 37.5,31 Q 40,32.5 42.5,31" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeLinecap="round" />
            
            {/* Horizon and Sea */}
            <rect x="3" y="60" width="48" height="17" fill="#0891b2" />
            <path d="M 3,60 Q 15,58 27,61 T 51,60 L 51,77 L 3,77 Z" fill="#0e7490" />
            <path d="M 6,64 H 22 M 30,68 H 45 M 15,72 H 35" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.5" strokeLinecap="round" />

            {/* Beach shore sand */}
            <path d="M 3,67 C 12,67 18,71 27,77 L 3,77 Z" fill="#fef08a" opacity="0.95" />
            
            {/* Elegant Palm tree silhouette */}
            <path d="M 8,74 Q 16,68 12,50" fill="none" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 12,50 Q 5,49 2,52" fill="none" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 12,50 Q 8,44 4,44" fill="none" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 12,50 Q 17,44 20,44" fill="none" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 12,50 Q 18,51 21,55" fill="none" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'castle-gold':
        return (
          <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
            <defs>
              <linearGradient id="castle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="60%" stopColor="#311042" />
                <stop offset="100%" stopColor="#4c0519" />
              </linearGradient>
            </defs>
            <rect width="54" height="80" rx="3.5" fill="url(#castle-grad)" />
            <rect x="2.5" y="2.5" width="49" height="75" rx="3" fill="none" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.8" />
            
            {/* Stars */}
            <circle cx="10" cy="12" r="0.8" fill="#ffffff" />
            <circle cx="42" cy="15" r="1" fill="#fef08a" />
            <circle cx="28" cy="22" r="0.5" fill="#ffffff" />
            <circle cx="16" cy="30" r="1.2" fill="#ffffff" />
            <circle cx="48" cy="34" r="0.8" fill="#fde047" />

            {/* Glowing lunar Moon */}
            <path d="M 38,10 C 33,10 29,14 29,19 C 29,24 33,28 38,28 C 36,26 35,23 35,19 C 35,15 36,12 38,10 Z" fill="#fbbf24" filter="drop-shadow(0 0 2px #fef08a)" />
            
            {/* Fortress Towers */}
            <rect x="6" y="44" width="42" height="33" rx="0.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
            <rect x="6" y="38" width="8" height="7" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
            <rect x="20" y="38" width="14" height="7" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
            <rect x="40" y="38" width="8" height="7" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
            
            {/* Central royal shield */}
            <circle cx="27" cy="54" r="5" fill="#eab308" stroke="#ffffff" strokeWidth="0.6" />
            <polygon points="27,51 30,55 27,58 24,55" fill="#7f1d1d" />

            {/* Detailed red banners */}
            <path d="M 10,26 L 10,38 M 10,26 L 15,29 L 10,32" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
            <path d="M 44,26 L 44,38 M 44,26 L 49,29 L 44,32" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
          </svg>
        );

      case 'neon-grid':
        return (
          <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
            <defs>
              <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#090d16" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
            </defs>
            <rect width="54" height="80" rx="3.5" fill="url(#neon-grad)" />
            <rect x="2.5" y="2.5" width="49" height="75" rx="3" fill="none" stroke="#22d3ee" strokeWidth="1" />
            
            {/* Synthwave grid perspective */}
            <path d="M 3,60 H 51 M 3,66 H 51 M 3,72 H 51 M 3,77 H 51" stroke="#ec4899" strokeWidth="0.5" strokeOpacity="0.4" />
            <path d="M 27,54 L 5,78 M 27,54 L 15,78 M 27,54 L 27,78 M 27,54 L 39,78 M 27,54 L 49,78" fill="none" stroke="#ec4899" strokeWidth="0.5" strokeOpacity="0.4" />

            {/* Glowing vector robot */}
            <rect x="17" y="15" width="20" height="15" rx="1.5" fill="#334155" stroke="#22d3ee" strokeWidth="0.8" />
            <circle cx="22" cy="20" r="1.5" fill="#22d3ee" filter="drop-shadow(0 0 1px #22d3ee)" />
            <circle cx="32" cy="20" r="1.5" fill="#22d3ee" filter="drop-shadow(0 0 1px #22d3ee)" />
            <path d="M 22,25.5 H 32" stroke="#ec4899" strokeWidth="1" strokeLinecap="round" />
            {/* Flashing antenna */}
            <line x1="27" y1="15" x2="27" y2="8" stroke="#22d3ee" strokeWidth="1" />
            <circle cx="27" cy="7" r="2" fill="#ef4444" filter="drop-shadow(0 0 1.5px #ef4444)" />
            
            <rect x="15" y="34" width="24" height="14" rx="1" fill="#1e293b" stroke="#ec4899" strokeWidth="0.8" />
            <text x="27" y="43" fill="#38bdf8" fontSize="4.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">ROB-95</text>
          </svg>
        );

      case 'classic-blue':
      default:
        return (
          <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
            <defs>
              <pattern id="retro-blue-mesh" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#ffffff" />
                <path d="M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6" stroke="#1d4ed8" strokeWidth="1.8" />
                <path d="M0,0 L8,8 M-2,6 L6,-2 M2,10 L10,2" stroke="#60a5fa" strokeWidth="1.0" strokeOpacity="0.8" />
                <circle cx="4" cy="4" r="0.8" fill="#1d4ed8" />
              </pattern>
            </defs>
            <rect width="54" height="80" rx="2.5" fill="#ffffff" />
            <rect x="2.5" y="2.5" width="49" height="75" rx="1.5" fill="none" stroke="#000000" strokeWidth="1" />
            {/* The signature retro blue weave pattern body */}
            <rect x="4" y="4" width="46" height="72" rx="1" fill="url(#retro-blue-mesh)" stroke="#000000" strokeWidth="0.5" />
          </svg>
        );
    }
  };

  const hasPosition = className.includes('absolute') || className.includes('fixed') || className.includes('relative') || className.includes('static');
  const positionClass = hasPosition ? '' : 'relative';

  if (!card.isFaceUp) {
    return (
      <div 
        style={style}
        className={`w-[44px] h-[68px] md:w-[85px] md:h-[125px] rounded-[3px] p-[1.5px] inline-block shrink-0 shadow-[-1px_1.5px_4px_rgba(0,0,0,0.15),2px_3px_6px_rgba(0,0,0,0.22)] border border-black/85 bg-white ${positionClass} ${className}`}
      >
        {renderCardBack()}
      </div>
    );
  }

  const dragGhostClasses = isDragGhost ? 'opacity-15 pointer-events-none select-none shadow-none border-dashed' : '';

  // Calculate relative stock offset if we are animating a draw entrance
  let initialProps = {};
  let animateProps = {};
  let transitionProps = {};

  if (animateFromStock) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const cardWidth = isMobile ? 44 : 85;
    const gap = isMobile ? 8 : 16;
    
    // Read the left coordinate of the fanned card (default to 0 if not provided)
    const leftPos = style?.left ? parseFloat(String(style.left)) || 0 : 0;
    
    // The stock pile starts exactly at -(cardWidth + gap) relative to the waste pile containing div.
    // Subtract leftPos so that the animation starts exactly aligned with the stock slot.
    const startX = -(cardWidth + gap) - leftPos;
    
    initialProps = {
      x: startX,
      rotate: staggerIndex !== undefined ? (staggerIndex === 0 ? -12 : staggerIndex === 1 ? -4 : 8) : -6,
      scale: 0.88,
      boxShadow: '0px 4px 8px rgba(0,0,0,0.4)',
    };
    
    animateProps = {
      x: 0,
      rotate: 0,
      scale: 1,
      boxShadow: '-1px 1.5px 4px rgba(0,0,0,0.15), 2px 3px 6px rgba(0,0,0,0.22)',
    };
    
    transitionProps = {
      type: 'spring',
      stiffness: 160,
      damping: 15,
      delay: staggerIndex !== undefined ? staggerIndex * 0.08 : 0,
    };
  }

  return (
    <motion.div
      layoutId={card.id}
      initial={animateFromStock ? initialProps : undefined}
      animate={animateFromStock ? animateProps : undefined}
      transition={animateFromStock ? transitionProps : undefined}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        touchAction: 'none',
        ...style,
      }}
      whileHover={isDragGhost ? undefined : { scale: 1.04, y: isSelected ? -8 : -4, zIndex: 999 }}
      className={`${positionClass} w-[44px] h-[68px] md:w-[85px] md:h-[125px] bg-[#ffffff] border border-black/85 rounded-[3px] px-0.5 py-0.5 md:p-1.5 flex flex-col justify-between shadow-[-1px_1.5px_4px_rgba(0,0,0,0.15),2px_3px_6px_rgba(0,0,0,0.22)] select-none cursor-pointer shrink-0 transition-[top,shadow,border-color] duration-150 ease-out ${
         isSelected 
           ? 'ring-[2.5px] ring-blue-600 border-blue-600 z-40 shadow-[0_0_8px_rgba(37,99,235,0.7)] scale-[1.03]' 
           : ''
      } ${colorClass} ${className} ${dragGhostClasses}`}
    >
      {/* Top Value and Suite */}
      <div className="flex flex-col items-start leading-none gap-[0px]">
        <span className="font-bold font-sans text-[11px] md:text-[21px] tracking-tight leading-none select-none">
          {getLabel(card.value)}
        </span>
        <span className="text-[10px] md:text-[18px] -mt-[1px] leading-none select-none">
          {SUIT_SYMBOLS[card.suit]}
        </span>
      </div>

      {/* Clean suit and typography panel for J, Q, K - absolutely no portraits! */}
      {card.value > 10 ? (
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
          {card.value === 13 && (
            <svg viewBox="0 0 24 24" className="w-[32px] h-[32px] md:w-[60px] md:h-[60px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* King's Crown (Coroa de Rei majestosa) */}
              <rect x="4" y="15" width="16" height="3" rx="0.5" fill="currentColor" fillOpacity="0.15" />
              <path d="M4 15 L4 9 L8 13 L12 6 L16 13 L20 9 L20 15 Z" fill="currentColor" fillOpacity="0.05" />
              <circle cx="4" cy="9" r="1.1" fill="currentColor" />
              <circle cx="8" cy="13" r="1.1" fill="currentColor" />
              <circle cx="12" cy="6" r="1.3" fill="currentColor" />
              <circle cx="16" cy="13" r="1.1" fill="currentColor" />
              <circle cx="20" cy="9" r="1.1" fill="currentColor" />
            </svg>
          )}
          {card.value === 12 && (
            <svg viewBox="0 0 24 24" className="w-[32px] h-[32px] md:w-[60px] md:h-[60px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Queen's Crown (Coroa de Rainha elegante / tiara curvada) */}
              <path d="M4 16 Q12 13 20 16" />
              <path d="M4 16 L5 10 L9 13.5 L12 7 L15 13.5 L19 10 L20 16 Z" fill="currentColor" fillOpacity="0.1" />
              <circle cx="5" cy="10" r="1" fill="currentColor" />
              <circle cx="12" cy="7" r="1" fill="currentColor" />
              <circle cx="19" cy="10" r="1" fill="currentColor" />
              <circle cx="9" cy="13.5" r="0.8" fill="currentColor" />
              <circle cx="15" cy="13.5" r="0.8" fill="currentColor" />
            </svg>
          )}
          {card.value === 11 && (
            <svg viewBox="0 0 24 24" className="w-[32px] h-[32px] md:w-[60px] md:h-[60px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Jack's Sword (Espada de Valete medieval e afiada) */}
              <path d="M12 4 L14 7 L14 15 L10 15 L10 7 Z" fill="currentColor" fillOpacity="0.1" />
              <line x1="12" y1="5" x2="12" y2="15" strokeWidth="0.8" strokeDasharray="3 1" />
              <path d="M8 15 H16" strokeWidth="2" />
              <circle cx="8" cy="15" r="0.8" fill="currentColor" />
              <circle cx="16" cy="15" r="0.8" fill="currentColor" />
              <line x1="12" y1="15" x2="12" y2="19" strokeWidth="2" />
              <circle cx="12" cy="20" r="1.2" fill="currentColor" />
            </svg>
          )}
        </div>
      ) : (
        // Center suit watermark with soft premium transparency
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-sans font-bold opacity-[0.06] select-none pointer-events-none" 
          style={{ 
            fontSize: window.innerWidth <= 768 ? '20px' : '44px'
          }}
        >
          {SUIT_SYMBOLS[card.suit]}
        </div>
      )}

      {/* Big bottom-right Suit */}
      <div className="self-end text-right leading-none select-none">
        <span className="text-[14px] md:text-[30px] leading-none p-0.5 select-none text-right">
          {SUIT_SYMBOLS[card.suit]}
        </span>
      </div>
    </motion.div>
  );
};
