/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private musicPlaying: boolean = false;
  private noteIndex: number = 0;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private musicType: string = 'chiptune_classic';
  private soundVolume: number = 0.55;
  private musicVolume: number = 0.40;

  constructor() {
    // Lazy initialisation to prevent audio playing before user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.musicPlaying) {
      this.stopMusic();
    } else if (enabled && !this.musicPlaying) {
      this.startMusic();
    }
  }

  setMusicType(type: string) {
    const changed = this.musicType !== type;
    this.musicType = type;
    if (changed && this.musicEnabled) {
      if (this.musicPlaying) {
        this.stopMusic();
      }
      this.startMusic();
    }
  }

  isMusicPlaying(): boolean {
    return this.musicPlaying && this.musicEnabled;
  }

  setSoundVolume(vol: number) {
    this.soundVolume = vol;
  }

  setMusicVolume(vol: number) {
    this.musicVolume = vol;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, isMusic: boolean = false) {
    this.initCtx();
    const enabled = isMusic ? this.musicEnabled : this.soundEnabled;
    if (!this.ctx || !enabled) return;

    const factor = isMusic ? this.musicVolume : this.soundVolume;
    const finalVolume = volume * factor;
    if (finalVolume <= 0) return;

    // Guard against context closed
    if (this.ctx.state === 'closed') return;

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(finalVolume, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Fallback playing tone:', e);
    }
  }

  // Classic Card Flip
  playFlip() {
    // Quick double bandpass tone that sounds like card friction
    this.playTone(380, 'triangle', 0.06, 0.15);
    setTimeout(() => {
      this.playTone(280, 'triangle', 0.05, 0.1);
    }, 30);
  }

  // Classic Card Move placing
  playMove() {
    this.playTone(180, 'sine', 0.08, 0.25);
    setTimeout(() => {
      this.playTone(240, 'sine', 0.04, 0.15);
    }, 40);
  }

  // Sfx when scoring to Foundation (satisfying chime)
  playToFoundation(cardValue: number) {
    // Scale tone with card value
    const baseFreq = 440 + cardValue * 30;
    this.playTone(baseFreq, 'sine', 0.15, 0.2);
    setTimeout(() => {
      this.playTone(baseFreq * 1.5, 'sine', 0.2, 0.15);
    }, 80);
  }

  // Clear / Undo sound
  playUndo() {
    this.playTone(320, 'triangle', 0.1, 0.15);
    setTimeout(() => {
      this.playTone(220, 'triangle', 0.15, 0.1);
    }, 60);
  }

  // Celebrating win melody
  playWinSound() {
    this.initCtx();
    const melody = [
      { f: 523, d: 150 }, // C5
      { f: 659, d: 150 }, // E5
      { f: 784, d: 150 }, // G5
      { f: 1046, d: 300 }, // C6
      { f: 784, d: 150 }, // G5
      { f: 1046, d: 600 }  // C6
    ];

    let delay = 0;
    melody.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.f, 'square', note.d / 1000, 0.12);
      }, delay);
      delay += note.d + 50;
    });
  }

  // Play loss sound
  playLossSound() {
    this.initCtx();
    const notes = [293, 277, 261, 220]; // D4, C#4, C4, A3
    let delay = 0;
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.3, idx === 3 ? 0.2 : 0.12);
      }, delay);
      delay += 250;
    });
  }

  // Error/invalid move buzz
  playError() {
    this.playTone(130, 'sawtooth', 0.15, 0.15);
  }

  // Simple background melody loop
  startMusic() {
    if (!this.musicEnabled) return;
    this.initCtx();
    if (this.musicPlaying) return;
    if (this.musicType === 'youtube') return;

    this.musicPlaying = true;
    
    // Balanced classical retro style mini-arpeggio playlist
    // Canon in D / Bach inspired chiptune loop
    const sheetClassic = [
      { f: 293, dur: 0.3, vol: 0.22 }, // D4
      { f: 370, dur: 0.3, vol: 0.22 }, // F#4
      { f: 440, dur: 0.3, vol: 0.22 }, // A4
      { f: 293, dur: 0.3, vol: 0.22 }, // D4
 
      { f: 220, dur: 0.3, vol: 0.22 }, // A3
      { f: 277, dur: 0.3, vol: 0.22 }, // C#4
      { f: 330, dur: 0.3, vol: 0.22 }, // E4
      { f: 220, dur: 0.3, vol: 0.22 }, // A3
 
      { f: 247, dur: 0.3, vol: 0.22 }, // B3
      { f: 293, dur: 0.3, vol: 0.22 }, // D4
      { f: 370, dur: 0.3, vol: 0.22 }, // F#4
      { f: 247, dur: 0.3, vol: 0.22 }, // B3
 
      { f: 185, dur: 0.3, vol: 0.22 }, // F#3
      { f: 220, dur: 0.3, vol: 0.22 }, // A3
      { f: 277, dur: 0.3, vol: 0.22 }, // C#4
      { f: 185, dur: 0.3, vol: 0.22 }, // F#3
 
      { f: 196, dur: 0.3, vol: 0.22 }, // G3
      { f: 247, dur: 0.3, vol: 0.22 }, // B3
      { f: 293, dur: 0.3, vol: 0.22 }, // D4
      { f: 196, dur: 0.3, vol: 0.22 }, // G3
 
      { f: 147, dur: 0.3, vol: 0.22 }, // D3
      { f: 185, dur: 0.3, vol: 0.22 }, // F#3
      { f: 220, dur: 0.3, vol: 0.22 }, // A3
      { f: 147, dur: 0.3, vol: 0.22 }  // D3
    ];

    const sheetRetroWave = [
      { f: 110, dur: 0.15, vol: 0.18 }, // A2
      { f: 110, dur: 0.15, vol: 0.18 }, // A2
      { f: 165, dur: 0.15, vol: 0.15 }, // E3
      { f: 110, dur: 0.15, vol: 0.18 }, // A2
      { f: 130, dur: 0.15, vol: 0.18 }, // C3
      { f: 130, dur: 0.15, vol: 0.18 }, // C3
      { f: 196, dur: 0.15, vol: 0.15 }, // G3
      { f: 130, dur: 0.15, vol: 0.18 }, // C3
      { f: 146, dur: 0.15, vol: 0.18 }, // D3
      { f: 146, dur: 0.15, vol: 0.18 }, // D3
      { f: 220, dur: 0.15, vol: 0.15 }, // A3
      { f: 146, dur: 0.15, vol: 0.18 }, // D3
      { f: 98, dur: 0.15, vol: 0.18 },  // G2
      { f: 98, dur: 0.15, vol: 0.18 },  // G2
      { f: 147, dur: 0.15, vol: 0.15 },  // D3
      { f: 98, dur: 0.15, vol: 0.18 }   // G2
    ];

    const sheetNostalgia = [
      { f: 261, dur: 0.35, vol: 0.25 }, // C4
      { f: 329, dur: 0.35, vol: 0.25 }, // E4
      { f: 392, dur: 0.35, vol: 0.25 }, // G4
      { f: 523, dur: 0.5, vol: 0.25 }, // C5
      { f: 440, dur: 0.35, vol: 0.25 }, // A4
      { f: 349, dur: 0.35, vol: 0.25 }, // F4
      { f: 392, dur: 0.7, vol: 0.25 }, // G4
      { f: 293, dur: 0.35, vol: 0.25 }, // D4
      { f: 349, dur: 0.35, vol: 0.25 }, // F4
      { f: 440, dur: 0.35, vol: 0.25 }, // A4
      { f: 587, dur: 0.5, vol: 0.25 }, // D5
      { f: 494, dur: 0.35, vol: 0.25 }, // B4
      { f: 392, dur: 0.35, vol: 0.25 }, // G4
      { f: 523, dur: 0.7, vol: 0.25 }  // C5
    ];

    const sheetGamer = [
      { f: 392, dur: 0.15, vol: 0.16 }, // G4
      { f: 392, dur: 0.15, vol: 0.16 }, // G4
      { f: 440, dur: 0.15, vol: 0.16 }, // A4
      { f: 392, dur: 0.15, vol: 0.16 }, // G4
      { f: 523, dur: 0.15, vol: 0.16 }, // C5
      { f: 494, dur: 0.3, vol: 0.16 }, // B4
      { f: 349, dur: 0.15, vol: 0.16 }, // F4
      { f: 349, dur: 0.15, vol: 0.16 }, // F4
      { f: 392, dur: 0.15, vol: 0.16 }, // G4
      { f: 349, dur: 0.15, vol: 0.16 }, // F4
      { f: 494, dur: 0.15, vol: 0.16 }, // B4
      { f: 440, dur: 0.3, vol: 0.16 }, // A4
      { f: 523, dur: 0.15, vol: 0.16 }, // C5
      { f: 587, dur: 0.15, vol: 0.16 }, // D5
      { f: 659, dur: 0.15, vol: 0.16 }, // E5
      { f: 523, dur: 0.3, vol: 0.16 }  // C5
    ];

    let sheet = sheetClassic;
    let tempo = 450;

    if (this.musicType === 'retro_wave') {
      sheet = sheetRetroWave;
      tempo = 200;
    } else if (this.musicType === 'nostalgia_cantabile') {
      sheet = sheetNostalgia;
      tempo = 400;
    } else if (this.musicType === 'gamer_anthem') {
      sheet = sheetGamer;
      tempo = 230;
    }

    this.noteIndex = 0;
    
    const playNext = () => {
      if (!this.musicPlaying || !this.musicEnabled || this.musicType === 'youtube') {
        this.musicPlaying = false;
        return;
      }
      
      const note = sheet[this.noteIndex % sheet.length];
      
      // Determine oscillator type depending on genre
      let oscType: OscillatorType = 'triangle';
      if (this.musicType === 'gamer_anthem') {
        oscType = 'square'; // Arcade 8-bit chip
      } else if (this.musicType === 'retro_wave') {
        oscType = 'sawtooth'; // Deep synthwave pulse
      } else if (this.musicType === 'nostalgia_cantabile') {
        oscType = 'sine'; // Super pure clean bell chime
      }
      
      this.playTone(note.f, oscType, note.dur, note.vol, true);
      this.noteIndex++;
      
      this.musicInterval = setTimeout(playNext, tempo);
    };

    playNext();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMusic() {
    this.setMusicEnabled(!this.musicEnabled);
  }
}

export const audioEngine = new AudioSynthesizer();
