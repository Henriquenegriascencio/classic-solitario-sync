/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CardBackStyle, TableColorStyle } from '../types';

interface MenuBarProps {
  score: number;
  movesCount: number;
  timerString: string;
  drawCount: 1 | 3;
  setDrawCount: (count: 1 | 3) => void;
  config: {
    cardBack: CardBackStyle;
    tableColor: TableColorStyle;
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
  setCardBack: (style: CardBackStyle) => void;
  setTableColor: (color: TableColorStyle) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onOpenStats: () => void;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
  onOpenThemes: () => void;
  onOpenColors: () => void;
  onOpenMusic: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  score,
  movesCount,
  timerString,
  drawCount,
  setDrawCount,
  config,
  setCardBack,
  setTableColor,
  setSoundEnabled,
  setMusicEnabled,
  onNewGame,
  onUndo,
  canUndo,
  onOpenStats,
  onOpenHelp,
  onOpenAbout,
  onOpenThemes,
  onOpenColors,
  onOpenMusic,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(prev => prev === menu ? null : menu);
  };

  const handleMenuHover = (menu: string) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const executeAction = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div 
      ref={containerRef}
      className="z-50 h-[30px] bg-[#c0c0c0] text-black border-b border-[#808080] flex items-center justify-between px-2 font-mono text-xs select-none shrink-0 relative shadow-[inset_1px_1px_0_#ffffff]"
      id="retro-menu-bar"
    >
      {/* Left Menu Triggers */}
      <div className="flex items-center gap-1">
        {/* MENU JOGO */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('jogo')}
            onMouseEnter={() => handleMenuHover('jogo')}
            className={`px-3 py-1 text-xs hover:bg-neutral-300 font-sans cursor-pointer focus:outline-none transition-all ${
              activeMenu === 'jogo' ? 'bg-neutral-400 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white' : 'border border-transparent'
            }`}
          >
            <span className="underline">J</span>ogo
          </button>

          {activeMenu === 'jogo' && (
            <div className="absolute left-0 mt-[1px] w-52 bg-[#c0c0c0] border-2 border-white border-b-black border-r-black shadow-lg p-0.5 z-[250] font-sans">
              <button
                onClick={() => executeAction(onNewGame)}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center justify-between text-xs cursor-pointer focus:outline-none"
              >
                <span>Novo Jogo</span>
                <span className="text-stone-600 group-hover:text-white font-mono text-[10px]">F2</span>
              </button>
              <button
                onClick={() => executeAction(onUndo)}
                disabled={!canUndo}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-600 rounded-none flex items-center justify-between text-xs cursor-pointer focus:outline-none"
              >
                <span>Desfazer</span>
                <span className="text-stone-600 font-mono text-[10px]">Ctrl+Z</span>
              </button>
              <div className="border-t border-[#808080] my-1 border-b border-white" />
              <button
                onClick={() => executeAction(onOpenStats)}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs cursor-pointer focus:outline-none"
              >
                Estatísticas...
              </button>
            </div>
          )}
        </div>

        {/* MENU OPÇÕES / CONFIG */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('opcoes')}
            onMouseEnter={() => handleMenuHover('opcoes')}
            className={`px-3 py-1 text-xs hover:bg-neutral-300 font-sans cursor-pointer focus:outline-none transition-all ${
              activeMenu === 'opcoes' ? 'bg-neutral-400 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white' : 'border border-transparent'
            }`}
          >
            <span className="underline">O</span>pções
          </button>

          {activeMenu === 'opcoes' && (
            <div className="absolute left-0 mt-[1px] w-64 bg-[#c0c0c0] border-2 border-white border-b-black border-r-black shadow-lg p-0.5 z-[250] font-sans">
              <div className="px-3 py-0.5 text-[9px] text-stone-600 font-bold uppercase tracking-wider">Modo de Compra</div>
              <button
                onClick={() => executeAction(() => setDrawCount(1))}
                className="w-full text-left px-5 py-1 hover:bg-[#000080] hover:text-white flex items-center justify-between text-xs cursor-pointer focus:outline-none"
              >
                <span>Comprar 1 carta (Fácil)</span>
                {drawCount === 1 && <span className="text-xs font-bold font-mono">✓</span>}
              </button>
              <button
                onClick={() => executeAction(() => setDrawCount(3))}
                className="w-full text-left px-5 py-1 hover:bg-[#000080] hover:text-white flex items-center justify-between text-xs cursor-pointer focus:outline-none"
              >
                <span>Comprar 3 cartas (Difícil)</span>
                {drawCount === 3 && <span className="text-xs font-bold font-mono">✓</span>}
              </button>

              <div className="border-t border-[#808080] my-1 border-b border-white" />
              <div className="px-3 py-0.5 text-[9px] text-stone-600 font-bold uppercase tracking-wider">Aparência & Sons</div>
              <button
                onClick={() => executeAction(onOpenThemes)}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs cursor-pointer focus:outline-none"
              >
                Dorsos das Cartas...
              </button>
              <button
                onClick={() => executeAction(onOpenColors)}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs cursor-pointer focus:outline-none"
              >
                Cor da Mesa (Feltro)...
              </button>
              <button
                onClick={() => executeAction(() => setSoundEnabled(!config.soundEnabled))}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center justify-between text-xs cursor-pointer focus:outline-none"
              >
                <span>Efeitos Sonoros</span>
                <span className="text-[9px] font-bold">{config.soundEnabled ? 'LIGADO' : 'MUTADO'}</span>
              </button>
              <button
                onClick={() => executeAction(onOpenMusic)}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center justify-between text-xs cursor-pointer focus:outline-none"
              >
                <span>Música Sintetizada...</span>
                <span className="text-[9px] font-bold">{config.musicEnabled ? 'TOCANDO' : 'DESLIGADO'}</span>
              </button>
            </div>
          )}
        </div>

        {/* MENU AJUDA */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('ajuda')}
            onMouseEnter={() => handleMenuHover('ajuda')}
            className={`px-3 py-1 text-xs hover:bg-neutral-300 font-sans cursor-pointer focus:outline-none transition-all ${
              activeMenu === 'ajuda' ? 'bg-neutral-400 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white' : 'border border-transparent'
            }`}
          >
            <span className="underline">A</span>juda
          </button>

          {activeMenu === 'ajuda' && (
            <div className="absolute left-0 mt-[1px] w-48 bg-[#c0c0c0] border-2 border-white border-b-black border-r-black shadow-lg p-0.5 z-[250] font-sans">
              <button
                onClick={() => executeAction(onOpenHelp)}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs cursor-pointer focus:outline-none"
              >
                Como Jogar
              </button>
              <div className="border-t border-[#808080] my-1 border-b border-white" />
              <button
                onClick={() => executeAction(onOpenAbout)}
                className="w-full text-left px-3 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs cursor-pointer focus:outline-none"
              >
                Sobre o Solitaire...
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
