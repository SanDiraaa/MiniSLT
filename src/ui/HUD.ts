/**
 * SlotKita - Oriental Palace Progressive Jackpot Header (HUD)
 * Phase 5: Dynamic Jackpot Accumulator, Indonesian Locale Formatting, and Ornate Temple Aesthetics
 */

import { GameStateStore } from '../core/GameState';
import { StateMachine } from '../core/FSM';

export interface ProgressiveMeters {
  grand: number;
  major: number;
  minor: number;
  mini: number;
}

export class HUD {
  private _container: HTMLElement;
  private _stateStore: GameStateStore;
  private _fsm: StateMachine;

  // Progressive base seeds
  private _meters: ProgressiveMeters = {
    grand: 100_000_000,
    major: 20_000_000,
    minor: 5_000_000,
    mini: 2_000_000,
  };

  private _grandEl!: HTMLElement;
  private _majorEl!: HTMLElement;
  private _minorEl!: HTMLElement;
  private _miniEl!: HTMLElement;
  private _stateBadgeEl!: HTMLElement;
  private _tickerInterval?: number;

  constructor(container: HTMLElement, stateStore: GameStateStore, fsm: StateMachine) {
    this._container = container;
    this._stateStore = stateStore;
    this._fsm = fsm;

    this.render();
    this.startProgressiveAccumulation();
    this.bindFsmListener();
  }

  public get meters(): Readonly<ProgressiveMeters> {
    return this._meters;
  }

  public get stateStore(): GameStateStore {
    return this._stateStore;
  }

  /**
   * Formats numbers to Indonesian coin representation (e.g. 10.000.000).
   */
  public static formatIndonesian(num: number): string {
    return Math.floor(num).toLocaleString('id-ID');
  }

  private render(): void {
    if (!this._container || typeof this._container.querySelector !== 'function') return;

    this._container.innerHTML = `
      <header class="w-full flex flex-col gap-2 mb-2 select-none">
        <!-- Top Imperial Dragon Roof & Game Title -->
        <div class="flex items-center justify-between pb-2 border-b border-amber-500/20">
          <div class="flex items-center gap-2">
            <span class="text-2xl" title="Slot Khas Higgs Domino">🏮</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  DUOFUDUOCAI 243-WAYS
                </span>
                <span class="hidden sm:inline-block text-[10px] text-emerald-400 font-mono">60 FPS WEBGL</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 gold-glow tracking-tight">
                SLOTKITA ARCADE
              </h1>
            </div>
          </div>

          <!-- FSM State Badge & System Reset -->
          <div class="flex items-center gap-2">
            <div class="text-right">
              <div class="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Status Engine</div>
              <div id="hudStateBadge" class="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-900 border border-amber-500/40 text-amber-300 shadow-md transition-all">
                ${this._fsm.currentState}
              </div>
            </div>
            <button id="resetSessionBtn" title="Reset Sesi & Saldo" class="px-2.5 py-1.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/60 active:scale-95 rounded-lg transition-all">
              🔄
            </button>
          </div>
        </div>

        <!-- 4 Dynamic Progressive Jackpot Meters -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <!-- GRAND JACKPOT -->
          <div class="relative overflow-hidden p-2 rounded-xl bg-gradient-to-b from-rose-950/90 via-slate-950 to-slate-950 border-2 border-rose-500/60 shadow-lg shadow-rose-950/40 group hover:border-rose-400 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black tracking-wider text-rose-400 uppercase flex items-center gap-1">
                <span>🐉</span> GRAND
              </span>
              <span class="text-[9px] text-rose-300/70 font-mono">PROGRESIF</span>
            </div>
            <div id="meterGrand" class="text-base sm:text-lg font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-amber-200 to-yellow-300 mt-0.5 tracking-tight">
              ${HUD.formatIndonesian(this._meters.grand)}
            </div>
          </div>

          <!-- MAJOR JACKPOT -->
          <div class="relative overflow-hidden p-2 rounded-xl bg-gradient-to-b from-blue-950/90 via-slate-950 to-slate-950 border-2 border-blue-500/60 shadow-lg shadow-blue-950/40 group hover:border-blue-400 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black tracking-wider text-blue-400 uppercase flex items-center gap-1">
                <span>🦚</span> MAJOR
              </span>
              <span class="text-[9px] text-blue-300/70 font-mono">PROGRESIF</span>
            </div>
            <div id="meterMajor" class="text-base sm:text-lg font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-sky-200 to-yellow-200 mt-0.5 tracking-tight">
              ${HUD.formatIndonesian(this._meters.major)}
            </div>
          </div>

          <!-- MINOR JACKPOT -->
          <div class="relative overflow-hidden p-2 rounded-xl bg-gradient-to-b from-emerald-950/90 via-slate-950 to-slate-950 border-2 border-emerald-500/60 shadow-lg shadow-emerald-950/40 group hover:border-emerald-400 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black tracking-wider text-emerald-400 uppercase flex items-center gap-1">
                <span>🐯</span> MINOR
              </span>
              <span class="text-[9px] text-emerald-300/70 font-mono">PROGRESIF</span>
            </div>
            <div id="meterMinor" class="text-base sm:text-lg font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-200 to-yellow-200 mt-0.5 tracking-tight">
              ${HUD.formatIndonesian(this._meters.minor)}
            </div>
          </div>

          <!-- MINI JACKPOT -->
          <div class="relative overflow-hidden p-2 rounded-xl bg-gradient-to-b from-amber-950/90 via-slate-950 to-slate-950 border-2 border-amber-500/60 shadow-lg shadow-amber-950/40 group hover:border-amber-400 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black tracking-wider text-amber-400 uppercase flex items-center gap-1">
                <span>🐢</span> MINI
              </span>
              <span class="text-[9px] text-amber-300/70 font-mono">PROGRESIF</span>
            </div>
            <div id="meterMini" class="text-base sm:text-lg font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 mt-0.5 tracking-tight">
              ${HUD.formatIndonesian(this._meters.mini)}
            </div>
          </div>
        </div>
      </header>
    `;

    this._grandEl = this._container.querySelector('#meterGrand')!;
    this._majorEl = this._container.querySelector('#meterMajor')!;
    this._minorEl = this._container.querySelector('#meterMinor')!;
    this._miniEl = this._container.querySelector('#meterMini')!;
    this._stateBadgeEl = this._container.querySelector('#hudStateBadge')!;
  }

  /**
   * Continuous dynamic accumulation simulating true arcade progressive meters.
   */
  private startProgressiveAccumulation(): void {
    if (this._tickerInterval) clearInterval(this._tickerInterval);
    if (typeof window === 'undefined') return;

    this._tickerInterval = setInterval(() => {
      // Dynamic micro-increment
      this._meters.grand += Math.floor(Math.random() * 25) + 12;
      this._meters.major += Math.floor(Math.random() * 12) + 5;
      this._meters.minor += Math.floor(Math.random() * 6) + 2;
      this._meters.mini += Math.floor(Math.random() * 3) + 1;

      this.updateDisplay();
    }, 1000) as unknown as number;
  }

  /**
   * Adds bet contribution percentage to progressive jackpot meters.
   */
  public contributeBet(betAmount: number): void {
    this._meters.grand += Math.floor(betAmount * 0.008);
    this._meters.major += Math.floor(betAmount * 0.005);
    this._meters.minor += Math.floor(betAmount * 0.003);
    this._meters.mini += Math.floor(betAmount * 0.001);
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (this._grandEl) this._grandEl.textContent = HUD.formatIndonesian(this._meters.grand);
    if (this._majorEl) this._majorEl.textContent = HUD.formatIndonesian(this._meters.major);
    if (this._minorEl) this._minorEl.textContent = HUD.formatIndonesian(this._meters.minor);
    if (this._miniEl) this._miniEl.textContent = HUD.formatIndonesian(this._meters.mini);
  }

  private bindFsmListener(): void {
    this._fsm.onStateChange((to) => {
      if (!this._stateBadgeEl) return;
      this._stateBadgeEl.textContent = to;

      switch (to) {
        case 'IDLE':
          this._stateBadgeEl.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-900 border border-amber-500/40 text-amber-300 shadow-md';
          break;
        case 'SPINNING':
          this._stateBadgeEl.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-900 border border-amber-400 text-amber-200 animate-pulse';
          break;
        case 'ANTICIPATION':
          this._stateBadgeEl.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-900 border border-rose-400 text-rose-200 animate-bounce';
          break;
        case 'FREE_SPINS':
          this._stateBadgeEl.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-900 border border-rose-400 text-rose-200 font-extrabold animate-pulse';
          break;
        case 'JACKPOT_BONUS':
          this._stateBadgeEl.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-yellow-900 border border-yellow-400 text-yellow-200 font-extrabold animate-bounce';
          break;
        default:
          this._stateBadgeEl.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-800 border border-slate-500 text-slate-200';
          break;
      }
    });
  }

  public destroy(): void {
    if (this._tickerInterval) {
      clearInterval(this._tickerInterval);
      this._tickerInterval = undefined;
    }
  }
}
