/**
 * SlotKita - Oriental Arcade Sound System
 * Phase 5: Web Audio API Procedural Synthesizer, Howler.js Integration, and Dynamic Audio Ducking
 */

import { Howler } from 'howler';

export class SoundSystem {
  private _audioCtx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _bgmGain: GainNode | null = null;
  private _sfxGain: GainNode | null = null;

  private _isMuted: boolean = false;
  private _isBgmPlaying: boolean = false;
  private _bgmInterval?: number;
  private _isDucked: boolean = false;
  private _userInteracted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Lazy AudioContext initialization on first user interaction
      const initAudioOnGesture = () => {
        if (!this._userInteracted) {
          this._userInteracted = true;
          this.initAudioContext();
          window.removeEventListener('pointerdown', initAudioOnGesture);
          window.removeEventListener('keydown', initAudioOnGesture);
        }
      };

      window.addEventListener('pointerdown', initAudioOnGesture, { once: true });
      window.addEventListener('keydown', initAudioOnGesture, { once: true });
    }
  }

  /**
   * Initializes Web Audio Context and audio bus architecture.
   */
  private initAudioContext(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        // Re-use Howler context if available, otherwise create new
        this._audioCtx = (Howler && Howler.ctx) ? Howler.ctx : new AudioContextClass();

        if (this._audioCtx.state === 'suspended') {
          this._audioCtx.resume();
        }

        // Master Gain
        this._masterGain = this._audioCtx.createGain();
        this._masterGain.gain.setValueAtTime(0.7, this._audioCtx.currentTime);
        this._masterGain.connect(this._audioCtx.destination);

        // BGM Bus
        this._bgmGain = this._audioCtx.createGain();
        this._bgmGain.gain.setValueAtTime(0.25, this._audioCtx.currentTime);
        this._bgmGain.connect(this._masterGain);

        // SFX Bus
        this._sfxGain = this._audioCtx.createGain();
        this._sfxGain.gain.setValueAtTime(0.8, this._audioCtx.currentTime);
        this._sfxGain.connect(this._masterGain);

        this.startBgmLoop();
      }
    } catch (e) {
      console.warn('[SoundSystem] AudioContext initialization deferred:', e);
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this._audioCtx) {
      this.initAudioContext();
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume();
    }
    return this._audioCtx;
  }

  public get isMuted(): boolean {
    return this._isMuted;
  }

  public get isDucked(): boolean {
    return this._isDucked;
  }

  /**
   * Toggles master audio mute state.
   */
  public toggleMute(): boolean {
    this._isMuted = !this._isMuted;
    if (this._masterGain && this._audioCtx) {
      const targetGain = this._isMuted ? 0 : 0.7;
      this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, this._audioCtx.currentTime);
      this._masterGain.gain.linearRampToValueAtTime(targetGain, this._audioCtx.currentTime + 0.1);
    }
    return this._isMuted;
  }

  /**
   * Sets master volume [0.0 - 1.0].
   */
  public setMasterVolume(vol: number): void {
    if (this._masterGain && this._audioCtx) {
      const clamped = Math.max(0, Math.min(1, vol));
      this._masterGain.gain.setValueAtTime(clamped, this._audioCtx.currentTime);
    }
  }

  /**
   * Audio Ducking: lowers BGM volume so win roll-ups and jackpots cut cleanly through the mix.
   */
  public duck(duckLevel: number = 0.08, duration: number = 0.3): void {
    if (!this._bgmGain || !this._audioCtx) return;
    this._isDucked = true;
    const now = this._audioCtx.currentTime;
    this._bgmGain.gain.cancelScheduledValues(now);
    this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
    this._bgmGain.gain.linearRampToValueAtTime(duckLevel, now + duration);
  }

  /**
   * Restores BGM volume back to normal level after celebration ends.
   */
  public unduck(normalLevel: number = 0.25, duration: number = 0.6): void {
    if (!this._bgmGain || !this._audioCtx) return;
    this._isDucked = false;
    const now = this._audioCtx.currentTime;
    this._bgmGain.gain.cancelScheduledValues(now);
    this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
    this._bgmGain.gain.linearRampToValueAtTime(normalLevel, now + duration);
  }

  // =========================================================================
  // BGM: Procedural Oriental Pentatonic Atmospheric Melody
  // =========================================================================
  private startBgmLoop(): void {
    if (this._isBgmPlaying || !this._audioCtx || !this._bgmGain) return;
    this._isBgmPlaying = true;

    // Traditional Chinese Pentatonic Scale: Gong (C4), Shang (D4), Jiao (E4), Zhi (G4), Yu (A4), C5
    const pentatonicScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    let noteIndex = 0;

    const playBgmPhrase = () => {
      if (!this._audioCtx || !this._bgmGain || this._isMuted) return;

      const baseFreq = pentatonicScale[noteIndex % pentatonicScale.length];
      noteIndex = (noteIndex + Math.floor(Math.random() * 3) + 1) % pentatonicScale.length;

      const osc = this._audioCtx.createOscillator();
      const gain = this._audioCtx.createGain();
      const filter = this._audioCtx.createBiquadFilter();

      // Guzheng / Bamboo flute soft timbre
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this._audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this._audioCtx.currentTime);

      const now = this._audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this._bgmGain);

      osc.start(now);
      osc.stop(now + 1.7);
    };

    this._bgmInterval = setInterval(playBgmPhrase, 1800) as unknown as number;
  }

  public stopBgm(): void {
    if (this._bgmInterval) {
      clearInterval(this._bgmInterval);
      this._bgmInterval = undefined;
    }
    this._isBgmPlaying = false;
  }

  // =========================================================================
  // SFX: Procedural Arcade Slot Sounds
  // =========================================================================

  /**
   * Spin Start sound: whoosh + high-tension spring release.
   */
  public playSpinStart(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Reel Ratchet Click during fast spinning.
   */
  public playReelClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(750 + Math.random() * 150, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * Reel Stop Clack (percussive mechanical stop).
   * Modulates pitch higher when Scatter symbols appear to build anticipation tension!
   */
  public playReelStop(pitchLevel: number = 1.0, isScatter: boolean = false): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    const now = ctx.currentTime;

    // 1. Heavy physical clack
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = (110 + pitchLevel * 20);
    osc.frequency.setValueAtTime(baseFreq * 2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // 2. If Scatter landed, ring an ethereal golden bell chime with rising pitch!
    if (isScatter) {
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();

      bell.type = 'sine';
      // Rising pentatonic bells: C5, E5, G5, C6
      const scatterFreqs = [523.25, 659.25, 783.99, 1046.5];
      const freq = scatterFreqs[Math.min(Math.floor(pitchLevel), scatterFreqs.length - 1)] || 880;
      bell.frequency.setValueAtTime(freq, now);

      bellGain.gain.setValueAtTime(0.3, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      bell.connect(bellGain);
      bellGain.connect(this._sfxGain);
      bell.start(now);
      bell.stop(now + 0.65);
    }
  }

  /**
   * Coin fountain roll-up sound (rapid chiming coins during counter roll-up).
   */
  public playCoinRollup(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Bright golden coin bell frequencies
    const freq = 1200 + Math.random() * 600;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Flying Bezier coin feeding swoosh into Fu Pot.
   */
  public playWildBezier(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * 3D Card flip sound in 12-Coin Jackpot Modal.
   */
  public playCoinFlip(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Resonant Oriental Bronze Gong & Imperial Fanfare for Big, Mega, and Super Wins.
   */
  public playBigWinGong(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    this.duck(0.05, 0.2);

    const now = ctx.currentTime;

    // 1. Deep Gong Fundamental (110 Hz with harmonics)
    const gong = ctx.createOscillator();
    const gongGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    gong.type = 'sawtooth';
    gong.frequency.setValueAtTime(110, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 2.5);

    gongGain.gain.setValueAtTime(0.5, now);
    gongGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    gong.connect(filter);
    filter.connect(gongGain);
    gongGain.connect(this._sfxGain);

    gong.start(now);
    gong.stop(now + 3.1);

    // 2. Imperial Fanfare arpeggio: C5, E5, G5, C6 chords
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.5];
    fanfareNotes.forEach((freq, idx) => {
      const noteOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      noteOsc.type = 'triangle';
      noteOsc.frequency.setValueAtTime(freq, now + 0.25 + idx * 0.15);

      const noteTime = now + 0.25 + idx * 0.15;
      noteGain.gain.setValueAtTime(0, noteTime);
      noteGain.gain.linearRampToValueAtTime(0.25, noteTime + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);

      noteOsc.connect(noteGain);
      noteGain.connect(this._sfxGain!);

      noteOsc.start(noteTime);
      noteOsc.stop(noteTime + 1.3);
    });
  }

  /**
   * Jackpot Explosion & Mini-Game Trigger Boom.
   */
  public playJackpotTrigger(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    this.duck(0.05, 0.1);

    const now = ctx.currentTime;

    // Deep sub-bass boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.95);
  }

  /**
   * Jackpot Victory Chime when claiming 3-of-a-kind jackpot.
   */
  public playJackpotWin(): void {
    this.playBigWinGong();
  }

  /**
   * UI Click / Button Tap.
   */
  public playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || this._isMuted || !this._sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.055);
  }
}
