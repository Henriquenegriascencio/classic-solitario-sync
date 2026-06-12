/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Board } from './components/Board';
import { CardComponent } from './components/CardComponent';
import { motion } from 'motion/react';
import { MenuBar } from './components/MenuBar';
import { TitleBar } from './components/TitleBar';
import { WindowsModal } from './components/WindowsModal';
import { VictoryCanvas } from './components/VictoryCanvas';
import { audioEngine } from './utils/audio';
import { 
  Card, 
  Suit, 
  LocationInfo, 
  HistoryState, 
  GameStats, 
  GameConfig, 
  CardBackStyle, 
  TableColorStyle,
  DragState,
  MusicType
} from './types';
import { 
  dealGame, 
  isValidMove, 
  findAutoMove, 
  checkCanAutoComplete, 
  getNextAutoCompleteStep, 
  checkHasMoviesLeft 
} from './utils/solitaireLogic';

const DEFAULT_CONFIG: GameConfig = {
  drawCount: 1,
  cardBack: 'classic-blue',
  tableColor: 'classic-green',
  soundEnabled: true,
  musicEnabled: false,
  musicType: 'chiptune_classic',
  soundVolume: 50,
  musicVolume: 40,
};

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  bestTime: 999999,
  bestScore: 0,
  streak: 0,
};

export default function App() {
  // --- Estados do Jogo Core ---
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [tableau, setTableau] = useState<Card[][]>(Array.from({ length: 7 }, () => []));
  const [foundations, setFoundations] = useState<Record<Suit, Card[]>>({
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  });

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [score, setScore] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // --- Estados de Configuração e Histórico Persistidos ---
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);

  // --- Estados de UI / Modais ---
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<LocationInfo | null>(null);
  const [isOpenAbout, setIsOpenAbout] = useState<boolean>(false);
  const [isOpenHelp, setIsOpenHelp] = useState<boolean>(false);
  const [isOpenStats, setIsOpenStats] = useState<boolean>(false);
  const [isOpenThemes, setIsOpenThemes] = useState<boolean>(false);
  const [isOpenColors, setIsOpenColors] = useState<boolean>(false);
  const [isOpenNoMoves, setIsOpenNoMoves] = useState<boolean>(false);
  const [isOpenVictory, setIsOpenVictory] = useState<boolean>(false);
  const [isOpenMusic, setIsOpenMusic] = useState<boolean>(false);
  const [victoryActive, setVictoryActive] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const [simulatedEQ, setSimulatedEQ] = useState<number[]>(Array.from({ length: 12 }, () => 4));

  useEffect(() => {
    if (!config.musicEnabled) {
      setSimulatedEQ(Array.from({ length: 12 }, () => 4));
      return;
    }
    const eqTimer = setInterval(() => {
      setSimulatedEQ(Array.from({ length: 12 }, () => Math.floor(Math.random() * 28) + 4));
    }, 180);
    return () => clearInterval(eqTimer);
  }, [config.musicEnabled]);

  const timerRef = useRef<any>(null);

  // --- Handlers de Arraste por Ponteiro Mecânico ---
  const handleDragStartPointer = (
    source: LocationInfo,
    rect: DOMRect,
    clientX: number,
    clientY: number
  ) => {
    // Only allow drag if game holds cards and is solvable
    if (isSolving || victoryActive) return;

    let cardsToMove: Card[] = [];
    if (source.type === 'tableau') {
      const col = tableau[source.idx!];
      cardsToMove = col.slice(source.cardIdx!);
    } else if (source.type === 'waste') {
      if (waste.length > 0) {
        cardsToMove = [waste[waste.length - 1]];
      }
    } else if (source.type === 'foundation') {
      const pile = foundations[source.suit!];
      if (pile.length > 0) {
        cardsToMove = [pile[pile.length - 1]];
      }
    }

    if (cardsToMove.length === 0) return;

    setDragState({
      source,
      cards: cardsToMove,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDragState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY,
        };
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragState) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      // Se for um movimento curtíssimo (menor de 5 pixels), interpretamos como clique,
      // logo deixamos os tratadores de onClick do React fazer o seu trabalho.
      const dx = clientX - dragState.startX;
      const dy = clientY - dragState.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        setDragState(null);
        return;
      }

      // Detetar o alvo
      const element = document.elementFromPoint(clientX, clientY);
      if (element) {
        const targetEl = element.closest('[data-drag-target]');
        if (targetEl) {
          try {
            const targetLoc = JSON.parse(targetEl.getAttribute('data-drag-target')!) as LocationInfo;
            handleMoveCards(dragState.source, targetLoc);
          } catch (err) {
            console.error('Falha ao desfragmentar alvo de queda:', err);
          }
        } else {
          // Se soltou num sítio inválido, toca som de erro clássico
          audioEngine.playError();
        }
      }

      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, tableau, waste, foundations]);

  // --- Carregar Configs e Stats do localStorage ---
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('solitaire_classic_config_v2');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as GameConfig;
        const merged = { ...DEFAULT_CONFIG, ...parsed };
        setConfig(merged);
        audioEngine.setSoundEnabled(merged.soundEnabled);
        if (merged.soundVolume !== undefined) {
          audioEngine.setSoundVolume(merged.soundVolume / 100);
        }
        if (merged.musicType) {
          audioEngine.setMusicType(merged.musicType);
        }
        if (merged.musicVolume !== undefined) {
          audioEngine.setMusicVolume(merged.musicVolume / 100);
        }
        audioEngine.setMusicEnabled(merged.musicEnabled);
      } else {
        localStorage.setItem('solitaire_classic_config_v2', JSON.stringify(DEFAULT_CONFIG));
      }

      const savedStats = localStorage.getItem('solitaire_classic_stats_v2');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        localStorage.setItem('solitaire_classic_stats_v2', JSON.stringify(DEFAULT_STATS));
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage:', e);
    }

    // Iniciar com uma partida nova
    startNewGame();
  }, []);

  // --- Ativar o contexto de áudio ao primeiro gesto do utilizador para cumprir regras de browser ---
  useEffect(() => {
    const resumeAudio = () => {
      const ctx = (audioEngine as any).ctx;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      } else if (!ctx) {
        (audioEngine as any).initCtx();
      }
    };
    window.addEventListener('click', resumeAudio, { once: true });
    window.addEventListener('keydown', resumeAudio, { once: true });
    window.addEventListener('pointerdown', resumeAudio, { once: true });
    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('pointerdown', resumeAudio);
    };
  }, []);

  // --- Salvar Configurações no localStorage ---
  const saveConfig = (newConfig: GameConfig) => {
    setConfig(newConfig);
    audioEngine.setSoundEnabled(newConfig.soundEnabled);
    if (newConfig.soundVolume !== undefined) {
      audioEngine.setSoundVolume(newConfig.soundVolume / 100);
    }
    if (newConfig.musicType) {
      audioEngine.setMusicType(newConfig.musicType);
    }
    if (newConfig.musicVolume !== undefined) {
      audioEngine.setMusicVolume(newConfig.musicVolume / 100);
    }
    audioEngine.setMusicEnabled(newConfig.musicEnabled);
    try {
      localStorage.setItem('solitaire_classic_config_v2', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
  };

  // --- Temporizador do Jogo ---
  useEffect(() => {
    if (isTimerRunning && !victoryActive && !isSolving) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
        // Descontar pontuação leve a cada 30 segundos (-2 pontos) (Regra Klondike Clássica)
        setTimer((currentTimer) => {
          if (currentTimer > 0 && currentTimer % 30 === 0) {
            setScore((s) => Math.max(0, s - 2));
          }
          return currentTimer;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, victoryActive, isSolving]);

  // --- Formatar Tempo em Cadeia de Caracteres ---
  const getTimerString = () => {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Função para clonagem profunda do estado atual ---
  const cloneState = useCallback(() => {
    const deepCloneCard = (c: Card) => ({ ...c });
    return {
      score,
      movesCount,
      stock: stock.map(deepCloneCard),
      waste: waste.map(deepCloneCard),
      foundations: {
        hearts: foundations.hearts.map(deepCloneCard),
        diamonds: foundations.diamonds.map(deepCloneCard),
        clubs: foundations.clubs.map(deepCloneCard),
        spades: foundations.spades.map(deepCloneCard),
      },
      tableau: tableau.map((col) => col.map(deepCloneCard)),
    };
  }, [score, movesCount, stock, waste, foundations, tableau]);

  const saveHistoryState = useCallback(() => {
    const freshSnapshot = cloneState();
    setHistory((prev) => [...prev, freshSnapshot]);
  }, [cloneState]);

  // --- Iniciar Novo Jogo ---
  const startNewGame = () => {
    const result = dealGame();
    setStock(result.stock);
    setWaste(result.waste);
    setTableau(result.tableau);
    setFoundations(result.foundations);
    setHistory([]);
    setScore(0);
    setMovesCount(0);
    setTimer(0);
    setSelectedLoc(null);
    setGameStarted(false);
    setIsTimerRunning(false);
    setVictoryActive(false);
    setIsSolving(false);
    setIsOpenNoMoves(false);
    setIsOpenVictory(false);

    // Contabilizar jogo iniciado
    setStats((prev) => {
      const updated = { ...prev, played: prev.played + 1 };
      localStorage.setItem('solitaire_classic_stats_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      audioEngine.playFlip();
    } catch (_) {}
  };

  // --- Desfazer Último Movimento ---
  const handleUndo = () => {
    if (history.length === 0) return;

    const previousStates = [...history];
    const prevState = previousStates.pop()!;

    setStock(prevState.stock);
    setWaste(prevState.waste);
    setTableau(prevState.tableau);
    setFoundations(prevState.foundations);
    setHistory(previousStates);
    setScore(prevState.score);
    setMovesCount(prevState.movesCount);
    setSelectedLoc(null);
    setIsOpenNoMoves(false);

    audioEngine.playUndo();
  };

  // --- Ativar o Cronômetro na primeira jogada ---
  const triggerTimerStart = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setIsTimerRunning(true);
    }
  };

  // --- Comprar Cartas do Stock para o Waste ---
  const handleDrawCard = () => {
    triggerTimerStart();
    setSelectedLoc(null);
    saveHistoryState();

    let nextStock = stock;
    let nextWaste = waste;

    if (stock.length > 0) {
      const updatedStock = [...stock];
      const updatedWaste = [...waste];
      const countToDraw = Math.min(config.drawCount, updatedStock.length);

      // Comprar 1 ou 3 cartas dependendo do modo
      const drawn: Card[] = [];
      for (let i = 0; i < countToDraw; i++) {
        const card = updatedStock.pop()!;
        card.isFaceUp = true;
        drawn.push(card);
      }

      // No Klondike, as cartas compradas entram no waste mantendo a ordem empilhada
      updatedWaste.push(...drawn);

      setStock(updatedStock);
      setWaste(updatedWaste);
      audioEngine.playFlip();

      nextStock = updatedStock;
      nextWaste = updatedWaste;
    } else {
      // Reciclar Waste de volta para o Stock
      if (waste.length === 0) return;

      const recycledStock = [...waste].reverse().map((c) => {
        c.isFaceUp = false;
        return c;
      });

      setStock(recycledStock);
      setWaste([]);
      audioEngine.playFlip();

      nextStock = recycledStock;
      nextWaste = [];
    }

    setMovesCount((m) => m + 1);
    checkGameStatus(nextStock, nextWaste, tableau, foundations);
  };

  // --- Auxiliar para Extrair Referencias de Pilhas ---
  const getPileRef = (loc: LocationInfo, stockArr: Card[], wasteArr: Card[], foundationsObj: Record<Suit, Card[]>, tableauArr: Card[][]) => {
    if (loc.type === 'stock') return stockArr;
    if (loc.type === 'waste') return wasteArr;
    if (loc.type === 'foundation') return foundationsObj[loc.suit!];
    if (loc.type === 'tableau') return tableauArr[loc.idx!];
    return null;
  };

  // --- Mover Cartas Core com Validação Reais ---
  const handleMoveCards = (source: LocationInfo, target: LocationInfo) => {
    triggerTimerStart();

    // Referencias das pilhas atuais
    const currentStock = [...stock];
    const currentWaste = [...waste];
    const currentTableau = tableau.map((col) => [...col]);
    const currentFoundations = {
      hearts: [...foundations.hearts],
      diamonds: [...foundations.diamonds],
      clubs: [...foundations.clubs],
      spades: [...foundations.spades],
    };

    const sourcePile = getPileRef(source, currentStock, currentWaste, currentFoundations, currentTableau);
    const targetPile = getPileRef(target, currentStock, currentWaste, currentFoundations, currentTableau);

    if (!sourcePile || !targetPile) return;

    // Slicing do stack que esta a ser movido (tableau pode mover varias cartas juntas)
    const cardsToMove = sourcePile.slice(source.cardIdx!);
    if (cardsToMove.length === 0) return;

    const leadCard = cardsToMove[0];

    // Checar apenas ultima carta se formos para fundação
    if (target.type === 'foundation' && source.cardIdx !== sourcePile.length - 1) {
      audioEngine.playError();
      return;
    }

    // Validar Movimento
    if (isValidMove(leadCard, target, currentFoundations, currentTableau)) {
      saveHistoryState();

      // Splice
      sourcePile.splice(source.cardIdx!);

      // Push
      targetPile.push(...cardsToMove);

      // Calcular Pontuação Real (Regras de Torneio Klondike)
      let scoreBonus = 0;
      if (target.type === 'foundation') {
        scoreBonus += 10; // +10 por carta arrumada na fundação
        audioEngine.playToFoundation(leadCard.value);
      } else if (target.type === 'tableau') {
        if (source.type === 'waste') {
          scoreBonus += 5; // Waste para Tableau = +5 pontos
        } else if (source.type === 'foundation') {
          scoreBonus -= 15; // Fundação para Tableau = -15 pontos (penalização clássica)
        }
        audioEngine.playMove();
      }

      // Se a coluna antiga do tableau ficou com carta do topo fechada, revelar e pontuar!
      if (source.type === 'tableau' && sourcePile.length > 0) {
        const newTop = sourcePile[sourcePile.length - 1];
        if (!newTop.isFaceUp) {
          newTop.isFaceUp = true;
          scoreBonus += 5; // Revelar carta do tableau = +5 pontos
          setTimeout(() => audioEngine.playFlip(), 180);
        }
      }

      // Aplicar estados atualizados
      setStock(currentStock);
      setWaste(currentWaste);
      setTableau(currentTableau);
      setFoundations(currentFoundations);
      setScore((s) => Math.max(0, s + scoreBonus));
      setMovesCount((m) => m + 1);
      setSelectedLoc(null);

      // Verificar possiveis vitórias ou auto-completes
      setTimeout(() => {
        checkGameStatus(currentStock, currentWaste, currentTableau, currentFoundations);
      }, 200);
    } else {
      audioEngine.playError();
      setSelectedLoc(null);
    }
  };

  // --- Gerir Eventos de Clique / Seleção de Posições ---
  const handleSelectLoc = (loc: LocationInfo, e: React.MouseEvent) => {
    // Se não houver carta selecionada ainda, tentar selecionar
    if (!selectedLoc) {
      const group = getPileRef(loc, stock, waste, foundations, tableau);
      if (!group || group.length === 0) return;

      const targetCard = group[loc.cardIdx!];
      if (!targetCard.isFaceUp) return; // Cartas de costas não podem ser selecionadas

      setSelectedLoc(loc);
      audioEngine.playFlip();
    } else {
      // Se clicarmos de volta no mesmo sitio, vamos tentar auto-mover (útil para cliques rápidos em mobile)
      if (
        selectedLoc.type === loc.type &&
        selectedLoc.idx === loc.idx &&
        selectedLoc.suit === loc.suit &&
        selectedLoc.cardIdx === loc.cardIdx
      ) {
        const group = getPileRef(loc, stock, waste, foundations, tableau);
        if (group && group.length > 0) {
          const clickedCard = group[loc.cardIdx!];
          if (clickedCard && clickedCard.isFaceUp) {
            const bestTarget = findAutoMove(clickedCard, loc, foundations, tableau);
            if (bestTarget) {
              handleMoveCards(loc, bestTarget);
              return;
            }
          }
        }
        setSelectedLoc(null);
        return;
      }

      // Segunda seleção constitui tentativa de movimento para a coluna/pilha alvo!
      // Vamos tentar deduzir qual pilha foi invocada baseando na posição
      const targetLocation: LocationInfo = { type: loc.type, idx: loc.idx, suit: loc.suit };
      handleMoveCards(selectedLoc, targetLocation);
    }
  };

  // --- Função Ativadora de Cliques em Monte Vazio ou Slots de Pilhas ---
  const handlePileClick = (target: LocationInfo) => {
    if (selectedLoc) {
      handleMoveCards(selectedLoc, target);
    }
  };

  // --- Clique Duplo / Movimento Automáticos (Fast-Move) ---
  const handleDoubleClickCard = (loc: LocationInfo, e: React.MouseEvent) => {
    const pile = getPileRef(loc, stock, waste, foundations, tableau);
    if (!pile || pile.length === 0) return;

    const clickedCard = pile[loc.cardIdx!];
    if (!clickedCard.isFaceUp) return;

    // Encontrar melhor destino válido alternativo
    const bestTarget = findAutoMove(clickedCard, loc, foundations, tableau);
    if (bestTarget) {
      handleMoveCards(loc, bestTarget);
    } else {
      // Se não há movimentos, fazer vibrar levemente
      audioEngine.playError();
    }
  };

  // --- Resolver Automático (Auto-Complete) ---
  // Quando restam apenas cartas reveladas no tabuleiro, o jogo resolve-se sozinho satisfyingly!
  const triggerAutoComplete = () => {
    if (isSolving) return;
    setIsSolving(true);
    triggerTimerStart();

    const runStep = () => {
      setFoundations((currentFoundations) => {
        setTableau((currentTableau) => {
          const step = getNextAutoCompleteStep(currentFoundations, currentTableau);
          if (step) {
            // Criar clones
            const nextFoundations = {
              hearts: [...currentFoundations.hearts],
              diamonds: [...currentFoundations.diamonds],
              clubs: [...currentFoundations.clubs],
              spades: [...currentFoundations.spades],
            };
            const nextTableau = currentTableau.map((col) => [...col]);

            const srcCol = nextTableau[step.source.idx!];
            const movingCard = srcCol.pop()!;
            
            const destPile = nextFoundations[step.target.suit!];
            destPile.push(movingCard);

            // Revelar carta anterior se houver
            if (srcCol.length > 0) {
              srcCol[srcCol.length - 1].isFaceUp = true;
            }

            setScore((s) => s + 10);
            setMovesCount((m) => m + 1);
            audioEngine.playToFoundation(movingCard.value);

            // Chamar recursivo com delay para visual estético corrido
            setTimeout(runStep, 100);

            // Retornar tabuleiro atualizado no setter interno
            return nextTableau;
          } else {
            // Solução concluída!
            setIsSolving(false);
            setTimeout(() => {
              triggerVictory();
            }, 300);
            return currentTableau;
          }
        });
        return currentFoundations;
      });
    };

    runStep();
  };

  // --- Detetar vitória ou derrota ---
  const checkGameStatus = (
    currentStock = stock,
    currentWaste = waste,
    currentTableau = tableau,
    currentFoundations = foundations
  ) => {
    // 1. Vitória: as 4 fundações estão cheias com 13 cartas completas (total 52)
    const winCount = 
      currentFoundations.hearts.length + 
      currentFoundations.diamonds.length + 
      currentFoundations.clubs.length + 
      currentFoundations.spades.length;

    if (winCount === 52) {
      triggerVictory();
      return;
    }

    // 2. Sem jogadas disponíveis (Bloqueio / Derrota)
    const movesAvailable = checkHasMoviesLeft(currentStock, currentWaste, currentTableau, currentFoundations);
    if (!movesAvailable && !isSolving) {
      setIsOpenNoMoves(true);
      audioEngine.playLossSound();
    }
  };

  // --- Efeito comemorativo de vitória ativa ---
  const triggerVictory = () => {
    setIsTimerRunning(false);
    setVictoryActive(true);
    setIsOpenVictory(true);
    audioEngine.playWinSound();

    // Atualizar Estatísticas históricas em localStorage
    setStats((prev) => {
      const nextStreak = prev.streak + 1;
      const nextBestTime = prev.bestTime === 0 || timer < prev.bestTime ? timer : prev.bestTime;
      const nextBestScore = score > prev.bestScore ? score : prev.bestScore;

      const updated = {
        played: prev.played,
        won: prev.won + 1,
        bestTime: nextBestTime,
        bestScore: nextBestScore,
        streak: nextStreak,
      };

      try {
        localStorage.setItem('solitaire_classic_stats_v2', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  // --- Atalhos de Teclado (F2, Ctrl+Z) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        startNewGame();
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [history]);

  // --- Redefinir Estatísticas ---
  const handleResetStats = () => {
    const freshStats = { ...DEFAULT_STATS, played: stats.played };
    setStats(freshStats);
    try {
      localStorage.setItem('solitaire_classic_stats_v2', JSON.stringify(freshStats));
    } catch (_) {}
  };

  // --- Auxiliar de Auto-complete visível na tela ---
  const offersAutoComplete = checkCanAutoComplete(stock, waste, tableau);

  return (
    <div className="w-screen h-screen bg-[#008080] flex items-center justify-center overflow-hidden p-0 md:p-3 select-none relative" id="retro-desktop">
      {/* If minimized, render a classic Windows 3.1 taskbar/minimized-icon at the bottom of the screen */}
      {isMinimized ? (
        <div 
          onClick={() => setIsMinimized(false)}
          onDoubleClick={() => setIsMinimized(false)}
          className="absolute bottom-4 left-4 w-40 bg-[#c0c0c0] text-black border-2 border-t-white border-l-white border-b-black border-r-black p-0.5 shadow-md flex flex-col cursor-pointer select-none active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
          style={{
            boxShadow: '1px 1px 0 #000, inset 1px 1px 0 #fff'
          }}
          title="Clique para Restaurar Solitaire"
        >
          <div className="bg-[#000080] text-white p-1 text-[11px] font-sans font-bold flex items-center justify-between">
            <span className="truncate">Solitaire</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
              className="w-3.5 h-3 bg-[#c0c0c0] text-black border border-t-white border-l-white border-b-black border-r-black text-[8px] flex items-center justify-center font-bold"
            >
              ▲
            </button>
          </div>
        </div>
      ) : (
        /* 3D Beveled Window frame typical of Windows 95/3.1 */
        <div 
          className={`w-full h-full bg-[#c0c0c0] flex flex-col font-sans select-none overflow-hidden relative ${
            isMaximized 
              ? 'p-0 md:p-0 w-screen h-screen max-w-none max-h-none border-0' 
              : 'md:max-w-6xl md:max-h-[92vh] md:border-2 md:border-t-white md:border-l-white md:border-b-black md:border-r-black'
          }`}
          style={{
            boxShadow: isMaximized ? 'none' : '1px 1px 0 #000, inset 1.5px 1.5px 0 #fff, inset -1.5px -1.5px 0 #808080'
          }}
          id="app-window"
        >
          {/* Title Bar layout inside window */}
          <div className="shrink-0">
            <TitleBar 
              title="Solitaire" 
              onClose={() => {
                if (confirm('Deseja reiniciar a partida?')) {
                  startNewGame();
                }
              }}
              onMinimize={() => setIsMinimized(true)}
              onMaximize={() => setIsMaximized(!isMaximized)}
            />
          </div>

          {/* 2. Barra de Menus Drops */}
          <MenuBar
            score={score}
            movesCount={movesCount}
            timerString={getTimerString()}
            drawCount={config.drawCount}
            setDrawCount={(cnt) => saveConfig({ ...config, drawCount: cnt })}
            config={config}
            setCardBack={(back) => saveConfig({ ...config, cardBack: back })}
            setTableColor={(color) => saveConfig({ ...config, tableColor: color })}
            setSoundEnabled={(snd) => saveConfig({ ...config, soundEnabled: snd })}
            setMusicEnabled={(mus) => saveConfig({ ...config, musicEnabled: mus })}
            onNewGame={startNewGame}
            onUndo={handleUndo}
            canUndo={history.length > 0}
            onOpenStats={() => setIsOpenStats(true)}
            onOpenHelp={() => setIsOpenHelp(true)}
            onOpenAbout={() => setIsOpenAbout(true)}
            onOpenThemes={() => setIsOpenThemes(true)}
            onOpenColors={() => setIsOpenColors(true)}
            onOpenMusic={() => setIsOpenMusic(true)}
          />

          {/* 3. Tabuleiro do Jogo Verde */}
          <div className="flex-grow flex flex-col relative min-h-0" id="game-table-container">
        {/* Cascade Victory Sprayer overlay canvas */}
        <VictoryCanvas 
          foundations={foundations} 
          active={victoryActive} 
          onComplete={() => {
            setVictoryActive(false);
            startNewGame();
          }}
        />

        <Board
          stock={stock}
          waste={waste}
          foundations={foundations}
          tableau={tableau}
          selectedLoc={selectedLoc}
          onSelectLoc={handleSelectLoc}
          onDoubleClickCard={handleDoubleClickCard}
          onDrawCard={handleDrawCard}
          onPileClick={handlePileClick}
          onMoveCards={handleMoveCards}
          cardBack={config.cardBack}
          tableColor={config.tableColor}
          dragState={dragState}
          onDragStartPointer={handleDragStartPointer}
          drawCount={config.drawCount}
        />

        {/* Dynamic Flying/Dragging Cards Stack following the pointer with Retro-Inertia effects */}
        {dragState && (
          <motion.div
            style={{
              position: 'fixed',
              left: dragState.rectLeft,
              top: dragState.rectTop,
              x: dragState.currentX - dragState.startX,
              y: dragState.currentY - dragState.startY,
              pointerEvents: 'none',
              zIndex: 9999,
              transformOrigin: 'top center',
            }}
            initial={{ scale: 1, rotate: 0 }}
            animate={{ 
              scale: 1.05, 
              rotate: (dragState.currentX - dragState.startX) * 0.04 
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            {dragState.cards.map((card, idx) => {
              const cascadeOffset = window.innerWidth <= 768 ? 9 : 22;
              const topOffset = idx * cascadeOffset;
              
              return (
                <CardComponent
                  key={card.id}
                  card={card}
                  location={{ ...dragState.source, cardIdx: dragState.source.cardIdx! + idx }}
                  isSelected={false}
                  onSelect={() => {}}
                  onDoubleClick={() => {}}
                  backStyle={config.cardBack}
                  style={{
                    position: idx === 0 ? 'relative' : 'absolute',
                    top: idx === 0 ? 0 : `${topOffset}px`,
                    left: 0,
                    zIndex: idx + 9999,
                    boxShadow: '5px 12px 24px rgba(0,0,0,0.45)',
                  }}
                />
              );
            })}
          </motion.div>
        )}

        {/* Flashing autocomplete bar when puzzle resolved */}
        {offersAutoComplete && !isSolving && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-100 border-2 border-stone-800 p-2 sm:p-3 flex items-center gap-3 sm:gap-6 shadow-[3px_3px_10px_rgba(0,0,0,0.5)] z-40 max-w-sm sm:max-w-md w-[90%] font-mono text-xs text-black">
            <span className="text-[10px] font-bold border border-stone-800 px-1 bg-yellow-300 select-none">INFO</span>
            <div className="flex-grow">
              <div className="font-bold">Resolver Jogo?</div>
              <div className="text-[10px] text-gray-600 font-sans mt-0.5">Todas as cartas estão abertas! O jogo pode terminar de forma automática.</div>
            </div>
            <button
              onClick={triggerAutoComplete}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 border border-stone-800 rounded-xs font-bold shrink-0 cursor-pointer text-xs uppercase"
            >
              Completar
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL NO MOVES (Derrota amigável com opção para Desfazer!) */}
      <WindowsModal
        title="Partida Sem Saídas - Paciência Studio"
        isOpen={isOpenNoMoves}
        onClose={() => setIsOpenNoMoves(false)}
      >
        <div className="flex items-start gap-4">
          <span className="text-xl font-bold bg-rose-600 text-white px-2 py-0.5 rounded-sm shrink-0 select-none">AVISO</span>
          <div>
            <h3 className="font-bold text-sm">Fim de Jogo!</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Não restam mais movimentos possíveis nesta partida. O stock e as colunas do tabuleiro estão bloqueados.
            </p>
            <div className="mt-4 flex flex-col gap-2 font-sans text-xs">
              <button
                onClick={() => {
                  setIsOpenNoMoves(false);
                  handleUndo();
                }}
                disabled={history.length === 0}
                className="w-full py-2.5 px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-35 disabled:pointer-events-none transition duration-150 flex items-center justify-center gap-2"
              >
                Desfazer última jogada e tentar outra rota
              </button>
              <button
                onClick={() => {
                  setIsOpenNoMoves(false);
                  startNewGame();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 cursor-pointer transition duration-150 flex items-center justify-center gap-2"
              >
                Iniciar uma nova partida aleatória
              </button>
            </div>
          </div>
        </div>
      </WindowsModal>

      {/* 4.1. MODAL VITÓRIA (Mensagem de Parabéns Retro) */}
      <WindowsModal
        title="Vitória Alcançada!"
        isOpen={isOpenVictory}
        onClose={() => setIsOpenVictory(false)}
        widthClass="max-w-sm sm:max-w-md"
      >
        <div className="flex flex-col items-center text-center gap-3 font-sans p-2 select-none">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-[#000080] font-extrabold text-xl px-6 py-2 border-2 border-[#808080] shadow-sm tracking-widest uppercase">
            Vitória!
          </div>
          <h2 className="font-bold text-lg text-amber-500 uppercase tracking-wider mt-2">Parabéns! Você Venceu!</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Você conseguiu organizar todas as 52 cartas nas fundações superiores e limpou o tabuleiro com maestria!
          </p>
          
          <div className="w-full bg-zinc-950 border border-zinc-850 p-4 text-left space-y-2 text-xs text-zinc-300 my-2 rounded-xl shadow-inner">
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>Tempo Total:</span>
              <span className="font-bold font-mono text-white">{getTimerString()}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>Pontuação Obtida:</span>
              <span className="font-bold font-mono text-emerald-400">{score} pontos</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1.5">
              <span>Total de Jogadas:</span>
              <span className="font-bold font-mono text-zinc-300">{movesCount} movimentos</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span>Seq. de Vitórias:</span>
              <span className="font-bold font-mono text-zinc-300">{stats.streak} partidas</span>
            </div>
          </div>

          <div className="flex gap-2 w-full mt-2">
            <button
              onClick={() => {
                setIsOpenVictory(false);
                startNewGame();
              }}
              className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 cursor-pointer text-center text-white transition shadow-md flex items-center justify-center gap-1"
            >
              Jogar Novamente
            </button>
            <button
              onClick={() => setIsOpenVictory(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer text-center transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </WindowsModal>

      {/* 5. MODAL SOBRE (Sleek About Dialog) */}
      <WindowsModal
        title="Sobre Paciência Studio"
        isOpen={isOpenAbout}
        onClose={() => setIsOpenAbout(false)}
        widthClass="max-w-xs sm:max-w-sm"
      >
        <div className="flex flex-col items-center text-center gap-3 font-sans">
          <div className="w-12 h-12 rounded-2xl bg-[#000080] text-white flex items-center justify-center shadow-lg text-lg font-bold border border-white/20">
            SOL
          </div>
          <h2 className="font-bold text-lg text-white mt-2">Paciência Studio</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Um jogo de cartas elegante, responsivo e com alta-fidelidade visual.<br />
            Aproveite efeitos sonoros integrados e estatísticas persistentes do navegador.
          </p>
          <div className="w-full h-[1px] bg-zinc-800 my-2" />
          <div className="text-xs text-zinc-350 text-left w-full space-y-1.5 font-sans">
            <div><b>Plataforma:</b> Paciência Studio Premium</div>
            <div><b>Música:</b> Web Audio API Synthesizer</div>
            <div><b>Framework:</b> React 19 + Tailwind CSS + Motion</div>
            <div className="pt-4 text-center text-zinc-500 select-none text-[10px] font-mono">Copyleft © 2026 Solitaire Studio</div>
          </div>
        </div>
      </WindowsModal>

      {/* 6. MODAL COMO JOGAR (Instructions) */}
      <WindowsModal
        title="Como Jogar"
        isOpen={isOpenHelp}
        onClose={() => setIsOpenHelp(false)}
        widthClass="max-w-xs sm:max-w-md"
      >
        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 font-sans text-xs text-zinc-300 leading-relaxed animate-fade-in">
          <section className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-800/40">
            <h4 className="font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5">
              Objetivo Geral
            </h4>
            <p className="mt-2 text-zinc-400">
              Organizar todas as 52 cartas em quatro pilhas de fundação superiores (uma para cada naipe: Copas ♥, Ouros ♦, Paus ♣, Espadas ♠), em ordem crescente, do Ás (A) ao Rei (K).
            </p>
          </section>

          <section className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-800/40">
            <h4 className="font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5">
              Regras de Empilhamento das Colunas
            </h4>
            <p className="mt-2 text-zinc-400">
              Nas 7 colunas inferiores do tabuleiro, as cartas só podem ser empilhadas em ordem decrescente (ex: 9 sobre 10) e com cores alternadas (Vermelho sobre Preto, Preto sobre Vermelho).
            </p>
          </section>

          <section className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-800/40">
            <h4 className="font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5">
              Colunas Vazias
            </h4>
            <p className="mt-2 text-zinc-400">
              Sempre que uma das 7 colunas do tabuleiro for limpa por completo, apenas um <b>Rei (K)</b> ou uma sequência iniciada por um Rei pode ser deitada nesse espaço vazio.
            </p>
          </section>

          <section className="bg-zinc-950/20 p-3 rounded-xl border border-zinc-800/40">
            <h4 className="font-bold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5">
              Atalhos e Dicas
            </h4>
            <ul className="list-disc pl-4 mt-2 space-y-1.5 text-zinc-400">
              <li><b className="text-zinc-200">Arrastar & Soltar:</b> Segurar e puxar cartas entre pilhas.</li>
              <li><b className="text-zinc-200">Clique Rápido / Duplo toque:</b> Toque duas vezes numa carta para movê-la automaticamente ao melhor local.</li>
              <li><b className="text-zinc-200">Teclas Especiais:</b> Atendimento ao F2 para Novo Jogo e Ctrl+Z para Desfazer.</li>
            </ul>
          </section>
        </div>
      </WindowsModal>

      {/* 7. MODAL ESTATÍSTICAS (Stats Board) */}
      <WindowsModal
        title="Estatísticas do Jogador"
        isOpen={isOpenStats}
        onClose={() => setIsOpenStats(false)}
      >
        <div className="font-sans text-xs flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-805/70 flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Partidas Jogadas</span>
              <span className="text-xl font-bold font-mono text-white mt-1">{stats.played}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-805/70 flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Partidas Ganhas</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1">{stats.won}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-805/70 flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Melhor Pontuação</span>
              <span className="text-xl font-bold font-mono text-white mt-1">{stats.bestScore}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-805/70 flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sequência de Vitórias</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1">{stats.streak}</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-3 border border-zinc-850 rounded-xl flex justify-between items-center text-zinc-200">
            <span className="text-zinc-400 font-medium">Melhor Tempo de Resolução:</span>
            <span className="font-bold font-mono text-sm text-white">
              {stats.bestTime === 999999 ? 'Sem registos' : `${Math.floor(stats.bestTime / 60)}m ${stats.bestTime % 60}s`}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-zinc-850 pt-4">
            <span className="text-[10px] text-zinc-500">Valores guardados offline neste navegador.</span>
            <button
              onClick={handleResetStats}
              className="px-3 py-1.5 text-2xs uppercase text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg cursor-pointer font-bold transition-all"
            >
              Zerar Estatísticas
            </button>
          </div>
        </div>
      </WindowsModal>

      {/* 8. MODAL VERSO DAS CARTAS (Theme Select) */}
      <WindowsModal
        title="Verso das Cartas - Selecionar Design"
        isOpen={isOpenThemes}
        onClose={() => setIsOpenThemes(false)}
        widthClass="max-w-xs sm:max-w-md"
      >
        <div className="font-sans text-xs text-black">
          <p className="font-semibold mb-3">Escolha o seu visual preferido para o verso do baralho:</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-2 bg-[#ffffff] border-2 border-t-stone-800 border-l-stone-800 border-b-white border-r-white max-h-[250px] overflow-y-auto custom-vintage-scrollbar shadow-inner">
            {[
              { id: 'classic-blue', name: 'Azul Real Clássico' },
              { id: 'classic-red', name: 'Vermelho Imperial' },
              { id: 'fish-sea', name: 'Peixes Tropicais' },
              { id: 'palm-sunset', name: 'Pôr do Sol Paradise' },
              { id: 'castle-gold', name: 'Castelo da Lua' },
              { id: 'neon-grid', name: 'Cyberpunk ROB-95' },
            ].map((theme) => {
              const isSelected = config.cardBack === theme.id;
              
              const renderBackPreview = (id: string) => {
                if (id === 'classic-blue') {
                  return (
                    <div className="w-[36px] h-[52px] border border-black bg-white p-[1px] shadow-sm flex-shrink-0">
                      <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
                        <defs>
                          <pattern id="mini-blue-mesh-dialog" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="#ffffff" />
                            <path d="M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6" stroke="#1d4ed8" strokeWidth="1.8" />
                            <path d="M0,0 L8,8 M-2,6 L6,-2 M2,10 L10,2" stroke="#60a5fa" strokeWidth="1.0" strokeOpacity="0.8" />
                          </pattern>
                        </defs>
                        <rect width="54" height="80" rx="1.5" fill="#ffffff" />
                        <rect x="2" y="2" width="50" height="76" rx="1" fill="none" stroke="#000" strokeWidth="1" />
                        <rect x="3.5" y="3.5" width="47" height="73" fill="url(#mini-blue-mesh-dialog)" stroke="#000" strokeWidth="0.5" />
                      </svg>
                    </div>
                  );
                }
                if (id === 'classic-red') {
                  return (
                    <div className="w-[36px] h-[52px] border border-black bg-white p-[1px] shadow-sm flex-shrink-0">
                      <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
                        <defs>
                          <pattern id="mini-red-mesh-dialog" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="#ffffff" />
                            <path d="M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6" stroke="#b91c1c" strokeWidth="1.8" />
                            <path d="M0,0 L8,8 M-2,6 L6,-2 M2,10 L10,2" stroke="#fca5a5" strokeWidth="1.0" strokeOpacity="0.8" />
                          </pattern>
                        </defs>
                        <rect width="54" height="80" rx="1.5" fill="#ffffff" />
                        <rect x="2" y="2" width="50" height="76" rx="1" fill="none" stroke="#000" strokeWidth="1" />
                        <rect x="3.5" y="3.5" width="47" height="73" fill="url(#mini-red-mesh-dialog)" stroke="#000" strokeWidth="0.5" />
                      </svg>
                    </div>
                  );
                }
                if (id === 'fish-sea') {
                  return (
                    <div className="w-[36px] h-[52px] border border-black bg-white p-[1px] shadow-sm flex-shrink-0">
                      <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
                        <rect width="54" height="80" rx="1.5" fill="#0284c7" />
                        <rect x="2" y="2" width="50" height="76" rx="1" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" />
                        <path d="M 10,36 C 18,27 28,34 34,37 L 39,32 L 38,44 L 34,37 Z" fill="#34d399" stroke="#ffffff" strokeWidth="0.8" />
                        <circle cx="15" cy="46" r="2" fill="#ffffff" fillOpacity="0.4" />
                        <circle cx="41" cy="22" r="1.5" fill="#ffffff" fillOpacity="0.4" />
                      </svg>
                    </div>
                  );
                }
                if (id === 'palm-sunset') {
                  return (
                    <div className="w-[36px] h-[52px] border border-black bg-white p-[1px] shadow-sm flex-shrink-0">
                      <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
                        <linearGradient id="mini-sunset-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#312e81" />
                          <stop offset="50%" stopColor="#831843" />
                          <stop offset="100%" stopColor="#db2777" />
                        </linearGradient>
                        <rect width="54" height="80" rx="1.5" fill="url(#mini-sunset-grad)" />
                        <rect x="2" y="2" width="50" height="76" rx="1" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.8" />
                        <circle cx="40" cy="28" r="6" fill="#fef08a" />
                        <path d="M 8,74 Q 16,68 12,50" fill="none" stroke="#78350f" strokeWidth="2.2" />
                      </svg>
                    </div>
                  );
                }
                if (id === 'castle-gold') {
                  return (
                    <div className="w-[36px] h-[52px] border border-black bg-white p-[1px] shadow-sm flex-shrink-0">
                      <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
                        <rect width="54" height="80" rx="1.5" fill="#1e1b4b" />
                        <rect x="2" y="2" width="50" height="76" rx="1" fill="none" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.8" />
                        <circle cx="38" cy="19" r="6" fill="#fbbf24" opacity="0.8" />
                        <rect x="12" y="44" width="30" height="33" fill="#475569" />
                      </svg>
                    </div>
                  );
                }
                if (id === 'neon-grid') {
                  return (
                    <div className="w-[36px] h-[52px] border border-black bg-white p-[1px] shadow-sm flex-shrink-0">
                      <svg viewBox="0 0 54 80" className="w-full h-full select-none" shapeRendering="geometricPrecision">
                        <rect width="54" height="80" rx="1.5" fill="#090d16" />
                        <rect x="2" y="2" width="50" height="76" rx="1" fill="none" stroke="#22d3ee" strokeWidth="1" />
                        <circle cx="27" cy="20" r="4.5" fill="#334155" stroke="#22d3ee" strokeWidth="0.8" />
                        <line x1="27" y1="15" x2="27" y2="8" stroke="#22d3ee" strokeWidth="1" />
                      </svg>
                    </div>
                  );
                }
                return <div className="w-8 h-11 bg-zinc-700 border border-white rounded-[2px]" />;
              };

              return (
                <div
                  key={theme.id}
                  onClick={() => saveConfig({ ...config, cardBack: theme.id as CardBackStyle })}
                  className={`p-2.5 flex flex-col items-center justify-center gap-2 cursor-pointer text-center select-none border-2 transition-none ${
                    isSelected 
                      ? 'bg-[#000080] text-white border-t-stone-850 border-l-stone-850 border-b-white border-r-white font-bold' 
                      : 'bg-[#c0c0c0] text-black border-t-white border-l-white border-b-stone-850 border-r-stone-850 hover:bg-[#d4d4d4]'
                  }`}
                  style={{
                    boxShadow: isSelected ? 'none' : 'inset 1px 1px 0 #fff'
                  }}
                >
                  {renderBackPreview(theme.id)}
                  <span className="text-[10px] leading-tight font-sans tracking-tight font-semibold">{theme.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </WindowsModal>

      {/* 9. MODAL COR DE FUNDO (Table Color Selector) */}
      <WindowsModal
        title="Cor do Tabuleiro - Feltro"
        isOpen={isOpenColors}
        onClose={() => setIsOpenColors(false)}
        widthClass="max-w-xs sm:max-w-md"
      >
        <div className="font-sans text-xs text-black">
          <p className="font-semibold mb-3">Escolha a cor do feltro para a mesa de jogo:</p>

          <div className="bg-white border-2 border-t-stone-800 border-l-stone-800 border-b-white border-r-white p-0.5 flex flex-col shadow-inner">
            {[
              { id: 'classic-green', name: 'Verde Clássico (Original)', colorHex: '#00a86b', dotHex: '#007a4d' },
              { id: 'deep-emerald', name: 'Esmeralda Casino', colorHex: '#0f2d1d', dotHex: '#081a10' },
              { id: 'royal-blue', name: 'Azul Real Confortável', colorHex: '#0b1b3d', dotHex: '#050d21' },
              { id: 'vegas-red', name: 'Vermelho Vegas', colorHex: '#5c0f1b', dotHex: '#3d070f' },
              { id: 'charcoal-gray', name: 'Carvão Moderno', colorHex: '#1c1917', dotHex: '#110f0e' },
            ].map((theme) => {
              const isSelected = config.tableColor === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => saveConfig({ ...config, tableColor: theme.id as TableColorStyle })}
                  className={`p-2 flex items-center justify-between cursor-pointer select-none font-sans text-xs transition-none ${
                    isSelected
                      ? 'bg-[#000080] text-white'
                      : 'text-black hover:bg-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-8 h-5 border border-black shrink-0 relative" 
                      style={{ 
                        backgroundColor: theme.colorHex,
                        backgroundImage: `radial-gradient(${theme.dotHex} 25%, transparent 25%), radial-gradient(${theme.dotHex} 25%, transparent 25%)`,
                        backgroundSize: '4px 4px',
                        backgroundPosition: '0 0, 2px 2px',
                        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.15)'
                      }}
                    />
                    <span className="font-semibold">{theme.name}</span>
                  </div>
                  {isSelected && <span className="text-xs font-bold font-mono pr-2">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </WindowsModal>

      {/* 10. MODAL REPRODUTOR DE MÚSICA & OPTIONS */}
      <WindowsModal
        title="Reprodutor de Música Studio"
        isOpen={isOpenMusic}
        onClose={() => setIsOpenMusic(false)}
        widthClass="max-w-md w-full"
      >
        <div className="font-sans text-xs space-y-3.5 text-black">
          {/* Retro digital monitor */}
          <div className="bg-black border-2 border-t-stone-800 border-l-stone-800 border-b-white border-r-white p-3.5 text-[#10b981] font-mono shadow-inner relative overflow-hidden flex justify-between items-center">
            <div className="space-y-1 relative z-10 select-none">
              <div className="text-[9px] text-[#404040] uppercase font-bold">Media Player v1.5</div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {config.musicEnabled ? 'SINTETIZADOR DE ÁUDIO DIRECT' : 'REPRODUTOR PARADO'}
              </div>
              <div className="text-[10px] text-emerald-500/85 italic max-w-[210px] truncate">
                {config.musicEnabled ? (
                  config.musicType === 'chiptune_classic' ? 'Tocando: Canon em Ré' :
                  config.musicType === 'retro_wave' ? 'Tocando: Aventura Retro Wave' :
                  config.musicType === 'nostalgia_cantabile' ? 'Tocando: Chimes Nostálgicos' :
                  'Tocando: Arcade Gamer Anthem'
                ) : 'Desligado - Escolha uma trilha sonora'}
              </div>
            </div>

            {/* Simulated Real-Time Fluctuating EQ Bars */}
            <div className="flex items-end gap-[2px] h-[32px] relative z-10 pl-2">
              {simulatedEQ.map((height, i) => (
                <div 
                  key={i} 
                  className="w-[3px] rounded-t-sm transition-all duration-150"
                  style={{
                    height: `${height}px`,
                    backgroundColor: i > 8 ? '#f43f5e' : i > 5 ? '#f59e0b' : '#10b981'
                  }}
                />
              ))}
            </div>
          </div>

          {/* General controls in beveled panel */}
          <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-stone-800 border-r-stone-800 p-2.5 flex items-center justify-between text-black" style={{ boxShadow: 'inset 1px 1px 0 #fff' }}>
            <span className="text-[10px] text-stone-800 font-bold uppercase">Estado Geral:</span>
            <div className="flex gap-2">
              <button
                onClick={() => saveConfig({ ...config, musicEnabled: true })}
                className={`px-4 py-1.5 font-bold text-xs select-none cursor-pointer min-w-[80px] border-2 transition-none ${
                  config.musicEnabled 
                    ? 'bg-[#d8d8d8] text-[#000080] border-t-stone-800 border-l-stone-800 border-b-white border-r-white font-extrabold' 
                    : 'bg-[#c0c0c0] text-black border-t-white border-l-white border-b-stone-800 border-r-stone-800 hover:bg-[#d8d8d8]'
                }`}
                style={{ boxShadow: config.musicEnabled ? 'none' : 'inset 1px 1px 0 #fff' }}
              >
                PLAY
              </button>
              <button
                onClick={() => saveConfig({ ...config, musicEnabled: false })}
                className={`px-4 py-1.5 font-bold text-xs select-none cursor-pointer min-w-[80px] border-2 transition-none ${
                  !config.musicEnabled 
                    ? 'bg-[#d8d8d8] text-rose-800 border-t-stone-800 border-l-stone-800 border-b-white border-r-white font-extrabold' 
                    : 'bg-[#c0c0c0] text-black border-t-white border-l-white border-b-stone-800 border-r-stone-800 hover:bg-[#d8d8d8]'
                }`}
                style={{ boxShadow: !config.musicEnabled ? 'none' : 'inset 1px 1px 0 #fff' }}
              >
                STOP
              </button>
            </div>
          </div>

          {/* Volume Control Grid inside a clean Beveled Panel */}
          <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-stone-800 border-r-stone-800 p-3.5 space-y-4 text-black" style={{ boxShadow: 'inset 1px 1px 0 #fff' }}>
            <span className="text-[10px] text-stone-850 block uppercase font-bold text-[#000080]">Controle Dedicado de Volume:</span>
            
            {/* Music volume slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-sans text-stone-800">
                <span>Volume da Trilha Sonora:</span>
                <span className="font-bold text-black">{(config.musicVolume !== undefined ? config.musicVolume : 40)}%</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 text-[10px]">
                <span className="font-mono">MUTE</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={config.musicVolume !== undefined ? config.musicVolume : 40}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    saveConfig({ ...config, musicVolume: val });
                  }}
                  className="w-full accent-[#000080] h-[5px] bg-[#808080] border border-t-[#404040] border-l-[#404040] border-b-white border-r-white cursor-pointer select-none outline-none"
                />
                <span className="font-mono">MAX</span>
              </div>
            </div>

            {/* Sound SFX volume slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-sans text-stone-800">
                <span>Volume dos Efeitos Sonoros (SFX):</span>
                <span className="font-bold text-black">{(config.soundVolume !== undefined ? config.soundVolume : 50)}%</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 text-[10px]">
                <span className="font-mono">MUTE</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={config.soundVolume !== undefined ? config.soundVolume : 50}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    saveConfig({ ...config, soundVolume: val });
                  }}
                  className="w-full accent-[#000080] h-[5px] bg-[#808080] border border-t-[#404040] border-l-[#404040] border-b-white border-r-white cursor-pointer select-none outline-none"
                />
                <span className="font-mono">MAX</span>
              </div>
            </div>
          </div>

          {/* 1. Predefined Chiptune loops */}
          <div className="space-y-2">
            <span className="text-[10px] text-stone-850 block uppercase font-bold">Trilhas Chiptune Integradas:</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'chiptune_classic', name: 'Canon em Ré', desc: 'Clássico Barroco' },
                { id: 'retro_wave', name: 'Retro Wave', desc: 'Synthwave Acústico' },
                { id: 'nostalgia_cantabile', name: 'Nostalgia', desc: 'Sinos Confortáveis' },
                { id: 'gamer_anthem', name: 'Arcade Anthem', desc: 'Agitado de Fliperama' },
              ].map((song) => {
                const isSelected = config.musicEnabled && config.musicType === song.id;
                return (
                  <button
                    key={song.id}
                    onClick={() => {
                      saveConfig({ ...config, musicType: song.id as MusicType, musicEnabled: true });
                    }}
                    className={`p-2 text-left cursor-pointer select-none border-2 font-sans flex flex-col justify-between transition-none ${
                      isSelected 
                        ? 'bg-[#d0d0d0] border-t-stone-800 border-l-stone-800 border-b-white border-r-white text-[#000080] font-bold' 
                        : 'bg-[#c0c0c0] border-t-white border-l-white border-b-stone-800 border-r-stone-800 text-black hover:bg-neutral-200'
                    }`}
                    style={{
                      boxShadow: isSelected ? 'none' : 'inset 1px 1px 0 #fff'
                    }}
                  >
                    <div className="font-bold text-xs flex justify-between items-center w-full">
                      <span>{song.name}</span>
                      {isSelected && <span className="text-[9px] text-[#000080] font-mono font-bold">(On)</span>}
                    </div>
                    <div className={`text-[10px] mt-1 font-sans ${isSelected ? 'text-[#0000a0]' : 'text-stone-600'}`}>{song.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Cassete View */}
          <div className="space-y-2 border-t border-[#808080] pt-4">
            <span className="text-[10px] text-stone-850 block uppercase font-bold text-[#000080]">Aparelho de Tape Cassete Real-Time:</span>
            
            <div className="bg-[#a0a0a0] border-2 border-t-white border-l-white border-b-black border-r-black p-3 flex flex-col select-none" style={{ boxShadow: 'inset 1px 1px 0 #fff' }}>
              <div className="bg-[#c0c0c0] border border-t-stone-800 border-l-stone-800 border-b-white border-r-white px-3 py-1 text-[9px] font-mono font-bold text-stone-800 flex justify-between items-center mb-3">
                <span>DECK CASSETE SYNTH v2.5</span>
                <span className={`font-extrabold ${config.musicEnabled ? 'text-emerald-800 animate-pulse' : 'text-stone-600'}`}>
                  {config.musicEnabled ? 'PLAYING DECK' : 'STOPPED'}
                </span>
              </div>

              <div className="bg-[#404040] border-2 border-t-black border-l-black border-b-white border-r-white p-2.5 flex flex-col items-center justify-center gap-3 relative">
                <div className="w-full max-w-[240px] h-[95px] bg-[#222222] border-2 border-t-black border-l-black border-b-stone-600 border-r-stone-600 p-3 flex flex-col justify-between relative shadow-inner">
                  <div className="text-[8px] text-stone-500 font-bold uppercase tracking-widest flex justify-between">
                    <span>A-SIDE</span>
                    <span>SYNTH DIRECT</span>
                  </div>

                  <div className="bg-[#111111] border border-stone-800 h-[36px] rounded-lg flex items-center justify-around relative px-4 overflow-hidden">
                    <div className="flex flex-col items-center justify-center">
                      <div className={`w-8 h-8 rounded-full border border-stone-600 flex items-center justify-center relative bg-stone-900 ${config.musicEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>
                        <div className="w-0.5 h-4 bg-stone-500 absolute rotate-45"></div>
                        <div className="w-0.5 h-4 bg-stone-500 absolute -rotate-45"></div>
                        <div className="w-3 h-3 rounded-full bg-black border border-stone-800 absolute"></div>
                      </div>
                    </div>

                    <div className="text-[8px] font-mono font-extrabold text-[#f59e0b] leading-tight text-center z-10 whitespace-pre">
                      {config.musicEnabled ? 'TAPE\nRUNNING' : 'TAPE\nPAUSED'}
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className={`w-8 h-8 rounded-full border border-stone-600 flex items-center justify-center relative bg-stone-900 ${config.musicEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>
                        <div className="w-0.5 h-4 bg-stone-500 absolute rotate-45"></div>
                        <div className="w-0.5 h-4 bg-stone-500 absolute -rotate-45"></div>
                        <div className="w-3 h-3 rounded-full bg-black border border-stone-800 absolute"></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] text-stone-500 font-bold flex justify-between items-center">
                    <span>SYNTH-FM V1</span>
                    <span className="font-mono text-emerald-400">HQ 16-BIT</span>
                  </div>
                </div>

                {/* LCD panel */}
                <div className="w-full bg-[#111111] border border-t-[#222] border-l-[#222] border-b-stone-600 border-r-stone-600 px-3 py-1.5 flex flex-col font-mono text-[9px] text-emerald-400">
                  <div className="flex justify-between items-center text-[7.5px] text-emerald-700 font-bold">
                    <span>SINAL DE ÁUDIO SINTETIZADOR</span>
                    <span>BITRATE: HI-FI</span>
                  </div>
                  <div className="truncate text-green-300 font-bold mt-0.5">
                    PLAYLIST: <span className="text-[#10b981] bg-black px-1.5 py-0.5 uppercase text-[9px] font-mono border border-stone-800">
                      {config.musicEnabled ? (
                        config.musicType === 'chiptune_classic' ? 'Canon em Ré' :
                        config.musicType === 'retro_wave' ? 'Retro Wave' :
                        config.musicType === 'nostalgia_cantabile' ? 'Nostalgia' :
                        'Gamer Anthem'
                      ) : 'SISTEMA SILENCIADO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </WindowsModal>

      {/* 11. Retro Beveled Status Bar at the bottom of the window, precisely matching the user's reference image */}
      <div className="h-[26px] bg-[#c0c0c0] border-t border-[#808080] shadow-[inset_1px_1px_0_#ffffff] flex items-center justify-between px-2 text-xs font-mono select-none text-black shrink-0">
        <div className="flex-grow text-left truncate text-[11px] px-1 font-sans font-semibold">
          {isSolving ? 'A resolver partida automaticamente...' : 'Modo retro ativado. Divirta-se!'}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div 
            className="px-2 min-w-[105px] h-5 flex items-center justify-start bg-[#c0c0c0] border border-t-[#808080] border-l-[#808080] border-b-white border-r-white text-[11px] font-sans font-bold"
          >
            Score: {score}
          </div>
          <div 
            className="px-2 min-w-[105px] h-5 flex items-center justify-start bg-[#c0c0c0] border border-t-[#808080] border-l-[#808080] border-b-white border-r-white text-[11px] font-sans font-bold"
          >
            Time: {timer}
          </div>
        </div>
      </div>
    </div>
    )}
  </div>
);
}
