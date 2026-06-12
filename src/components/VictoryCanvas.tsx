/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Card, Suit } from '../types';

interface VictoryCanvasProps {
  foundations: Record<Suit, Card[]>;
  onComplete: () => void;
  active: boolean;
}

interface ParticleCard {
  card: Card;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  bounces: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const VictoryCanvas: React.FC<VictoryCanvasProps> = ({
  foundations,
  onComplete,
  active,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill user view
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      // High-end deep emerald felt filled initially
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Collect all cards from foundation to bounce.
    // In typical Windows Solitaire, they cascade from Kings down to Aces, One pile at a time, or all together.
    // Let's copy cards in order of highest card (top of foundation, e.g. K) down to Ace.
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const cardsToCascade: Card[] = [];

    // Gather cards starting from top (King) down to Ace (1) for each suit
    suits.forEach((suit) => {
      const pile = foundations[suit];
      for (let i = pile.length - 1; i >= 0; i--) {
        cardsToCascade.push(pile[i]);
      }
    });

    if (cardsToCascade.length === 0) {
      // Setup some dummy cards so the screen cascades anyway even if empty
      const tempSuits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
      tempSuits.forEach((s) => {
        for (let v = 13; v >= 1; v--) {
          cardsToCascade.push({
            id: `${s}-${v}`,
            suit: s,
            value: v,
            isFaceUp: true,
            color: (s === 'hearts' || s === 'diamonds') ? 'red' : 'black',
          });
        }
      });
    }

    let currentCardIndex = 0;
    let activeParticles: ParticleCard[] = [];

    const cardW = window.innerWidth <= 768 ? 44 : 85;
    const cardH = window.innerWidth <= 768 ? 68 : 125;

    // Helper to launch next card
    // It starts at the top-right foundation positions roughly
    const launchCard = (card: Card) => {
      if (!card) return;

      // Foundations are roughly situated on the top-right of screen
      // Let's spawn them from there!
      const startX = canvas.width - (cardW * 2.2) - (Math.random() * 80);
      const startY = 25 + (Math.random() * 20);

      // Random speed values
      const vx = (Math.random() * 5 + 2) * (Math.random() > 0.5 ? 1 : -1); // left or right
      const vy = -1 - Math.random() * 4; // slight up jump

      activeParticles.push({
        card,
        x: startX,
        y: startY,
        vx,
        vy,
        width: cardW,
        height: cardH,
        bounces: 0,
      });
    };

    // Launch first card
    launchCard(cardsToCascade[currentCardIndex]);

    let animationFrameId: number;
    const gravity = 0.25;
    const friction = 0.85;

    const getSuitSymbol = (suit: Suit) => SUIT_SYMBOLS[suit] || '';
    const getCardLabel = (val: number) => {
      if (val === 1) return 'A';
      if (val === 11) return 'J';
      if (val === 12) return 'Q';
      if (val === 13) return 'K';
      return val.toString();
    };

    // Draw single card face onto Canvas context
    const drawCanvasCard = (cParticle: ParticleCard) => {
       const { card, x, y, width, height } = cParticle;
       
       // Shadow / Border card shape
       ctx.beginPath();
       ctx.fillStyle = '#ffffff';
       ctx.strokeStyle = '#e2e8f0';
       ctx.lineWidth = 1;
       
       // Draw rounded rectangle manually
       const radius = 5;
       ctx.roundRect ? ctx.roundRect(x, y, width, height, radius) : ctx.rect(x, y, width, height);
       ctx.fill();
       ctx.stroke();

       // Card Rank Value Text
       ctx.font = `bold ${width <= 44 ? '11px' : '20px'} system-ui, sans-serif`;
       ctx.fillStyle = card.color === 'red' ? '#e11d48' : '#18181b';
       const label = getCardLabel(card.value);
       ctx.fillText(label, x + (width <= 44 ? 3 : 8), y + (width <= 44 ? 11 : 22));
 
       // Suit Icon upper left
       ctx.font = `${width <= 44 ? '10px' : '16px'} system-ui, sans-serif`;
       const symbol = getSuitSymbol(card.suit);
       ctx.fillText(symbol, x + (width <= 44 ? 3 : 8), y + (width <= 44 ? 22 : 40));
 
       // Giant center suit decoration
       ctx.font = `${width <= 44 ? '16px' : '36px'} system-ui, sans-serif`;
       ctx.fillStyle = card.color === 'red' ? 'rgba(225, 29, 72, 0.08)' : 'rgba(24, 24, 27, 0.08)';
       ctx.fillText(symbol, x + (width/2) - (width <= 44 ? 5 : 12), y + (height/2) + (width <= 44 ? 5 : 12));
 
       // Big bottom right suit
       ctx.font = `${width <= 44 ? '15px' : '32px'} system-ui, sans-serif`;
       ctx.fillStyle = card.color === 'red' ? '#e11d48' : '#18181b';
       ctx.fillText(symbol, x + width - (width <= 44 ? 13 : 26), y + height - (width <= 44 ? 4 : 8));
     };

    const update = () => {
      // NOTE: We do NOT clear the canvas completely each frame!
      // This is what gives the classic trailing cascading stream effect.

      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];

        // Draw card at current coordinates
        drawCanvasCard(p);

        // Physics velocity
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;

        // Bottom bounce boundary
        if (p.y + p.height >= canvas.height) {
          p.y = canvas.height - p.height;
          p.vy = -p.vy * friction;
          p.bounces++;
        }

        // Remove if off bounds
        const isOffscreen = p.x + p.width < 0 || p.x > canvas.width || p.bounces > 15;

        if (isOffscreen) {
          activeParticles.splice(i, 1);
        }
      }

      // If active particle counts drop or there's space, spawn the next card cascade
      // We spawn with a small frame interval or when the active card bounces a little
      if (activeParticles.length > 0) {
        const lead = activeParticles[activeParticles.length - 1];
        // If the current lead card has bounced at least once or of screen, launch the next one
        if ((lead.bounces > 0 || lead.y > canvas.height * 0.4) && currentCardIndex < cardsToCascade.length - 1) {
          currentCardIndex++;
          launchCard(cardsToCascade[currentCardIndex]);
        }
      } else {
        // No active particles but more cards are waiting
        if (currentCardIndex < cardsToCascade.length - 1) {
          currentCardIndex++;
          launchCard(cardsToCascade[currentCardIndex]);
        } else {
          // All deck has cascade and finished bouncing!
          onComplete();
          return;
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active, foundations, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-pointer z-45"
      title="Parabéns! Pressione para reiniciar."
      style={{ touchAction: 'none' }}
    />
  );
};
