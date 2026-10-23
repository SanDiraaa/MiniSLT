/**
 * SlotKita - Arcade Player Control Deck
 * Phase 5: Bet Adjusters, Max Bet, Glowing Spin Button, Auto-Spin Modal & Sound Toggle
 */

import { GameStateStore, BET_LEVELS, DENOM_PRESETS } from '../core/GameState';
import { StateMachine, SlotState } from '../core/FSM';
import { SoundSystem } from '../core/SoundSystem';

export class Controls {
  private _container: HTMLElement;
  private _stateStore: GameStateStore;
  private _fsm: StateMachine;
  private _soundSystem: SoundSystem;
  private _onSpinRequested: () => void;

  // DOM Elements
  private _balanceEl!: HTMLElement;
  private _betEl!: HTMLElement;
  private _winEl!: HTMLElement;
  private _betLevelEl!: HTMLElement;
  private _denomSelect!: HTMLSelectElement;
  private _spinBtn!: HTMLButtonElement;
  private _turboBtn!: HTMLButtonElement;
  private _autoSpinBtn!: HTMLButtonElement;
  private _maxBetBtn!: HTMLButtonElement;
  private _soundBtn!: HTMLButtonElement;
  private _autoSpinModal!: HTMLElement;

  constructor(
    container: HTMLElement,
    stateStore: GameStateStore,
    fsm: StateMachine,
    soundSystem: SoundSystem,
    onSpinRequested: () => void
  ) {
    this._container = container;
    this._stateStore = stateStore;
    this._fsm = fsm;
    this._soundSystem = soundSystem;
    this._onSpinRequested = onSpinRequested;

    this.render();
    this.bindEvents();
    this.subscribeStore();
    this.bindFsm();
    this.syncVisuals();
  }

  private render(): void {
    const s = this._stateStore.getState();

    this._container.innerHTML = `
      <section class="oriental-card p-3 sm:p-4 rounded-2xl border-2 border-amber-500/40 shadow-2xl relative select-none">
        <!-- Top Metrics Row: Saldo, Bet, Win -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
          <!-- Saldo / Wallet -->
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-center">
            <div class="text-[9px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              <span>🪙</span> SALDO KOIN
            </div>
            <div id="deckBalance" class="text-sm sm:text-xl font-black font-mono text-amber-200 tracking-tight truncate">
              ${s.balance.toLocaleString('id-ID')}
            </div>
          </div>

          <!-- Total Taruhan -->
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-center">
            <div class="text-[9px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              <span>🎯</span> TOTAL TARUHAN
            </div>
            <div id="deckBet" class="text-sm sm:text-xl font-black font-mono text-yellow-300 tracking-tight truncate">
              ${s.currentBet.toLocaleString('id-ID')}
            </div>
          </div>

          <!-- Kemenangan Terakhir -->
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex flex-col justify-center">
            <div class="text-[9px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
              <span>🏆</span> KEMENANGAN
            </div>
            <div id="deckWin" class="text-sm sm:text-xl font-black font-mono text-emerald-300 tracking-tight truncate">
              ${s.winAmount.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <!-- Controls Action Row -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
          <!-- Bet Modifiers: Level, Denom, Max Bet -->
          <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <!-- Bet Level - / + -->
            <div class="flex items-center bg-slate-950 rounded-xl border border-amber-500/40 p-1">
              <button id="levelDownBtn" title="Turunkan Level Bet" class="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 font-black text-sm active:scale-95 transition-all">
                -
              </button>
              <div class="px-2.5 text-center">
                <div class="text-[8px] text-slate-400 uppercase font-bold leading-none">LVL</div>
                <div id="deckBetLevel" class="text-xs font-mono font-black text-white leading-tight">
                  ${s.betLevel}
                </div>
              </div>
              <button id="levelUpBtn" title="Naikkan Level Bet" class="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 font-black text-sm active:scale-95 transition-all">
                +
              </button>
            </div>

            <!-- Denom Dropdown -->
            <div class="flex flex-col">
              <span class="text-[8px] text-slate-400 uppercase font-bold ml-1">DENOM</span>
              <select id="deckDenomSelect" class="bg-slate-950 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold rounded-xl px-2 py-1.5 outline-none cursor-pointer hover:border-amber-400 transition-all">
                ${DENOM_PRESETS.map(
                  (d) => `<option value="${d}" ${d === s.denom ? 'selected' : ''}>${d.toLocaleString('id-ID')}</option>`
                ).join('')}
              </select>
            </div>

            <!-- MAX BET Button -->
            <button id="maxBetBtn" class="px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-slate-950 text-[10px] font-black tracking-wider uppercase border border-amber-400 shadow-md active:scale-95 transition-all">
              ⚡ MAX BET
            </button>
          </div>

          <!-- Spin Engine Triggers & Options -->
          <div class="flex items-center gap-1.5 sm:gap-2">
            <!-- Sound Toggle Button -->
            <button id="soundToggleBtn" title="Matikan/Hidupkan Suara" class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-amber-300 text-sm hover:border-amber-500 active:scale-95 transition-all">
              🔊
            </button>

            <!-- Turbo Spin Toggle -->
            <button id="deckTurboBtn" class="px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-black transition-all ${
              s.isTurbo
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
            }">
              ⚡ TURBO
            </button>

            <!-- Auto Spin Trigger -->
            <button id="deckAutoSpinBtn" class="px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-black transition-all ${
              s.isAutoSpin
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/30 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
            }">
              🔄 ${s.isAutoSpin ? `AUTO (${s.autoSpinCount})` : 'AUTO'}
            </button>

            <!-- Large Radiant Spin Button -->
            <button id="deckSpinBtn" class="relative group px-6 sm:px-9 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-amber-500/30 active:scale-95 transition-all border-2 border-yellow-200">
              <span id="spinBtnText">🎲 PUTAR</span>
            </button>
          </div>
        </div>

        <!-- Auto Spin Selection Popover Modal -->
        <div id="autoSpinModal" class="hidden absolute right-4 bottom-16 w-64 p-3 rounded-2xl bg-slate-950/95 border-2 border-amber-500/60 shadow-2xl z-30 backdrop-blur-md">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20">
            <span class="text-xs font-black text-amber-300 uppercase tracking-wider">PILIH PUTARAN OTOMATIS</span>
            <button id="closeAutoModalBtn" class="text-slate-400 hover:text-white text-xs px-1.5 py-0.5">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button data-spins="10" class="auto-opt-btn p-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-200 border border-amber-500/30 text-xs font-mono font-bold transition-all">
              10 Putaran
            </button>
            <button data-spins="50" class="auto-opt-btn p-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-200 border border-amber-500/30 text-xs font-mono font-bold transition-all">
              50 Putaran
            </button>
            <button data-spins="100" class="auto-opt-btn p-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-200 border border-amber-500/30 text-xs font-mono font-bold transition-all">
              100 Putaran
            </button>
            <button data-spins="999" class="auto-opt-btn p-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 text-xs font-black transition-all">
              Tak Hingga (∞)
            </button>
          </div>
        </div>
      </section>
    `;

    // Cache element references
    this._balanceEl = this._container.querySelector('#deckBalance')!;
    this._betEl = this._container.querySelector('#deckBet')!;
    this._winEl = this._container.querySelector('#deckWin')!;
    this._betLevelEl = this._container.querySelector('#deckBetLevel')!;
    this._denomSelect = this._container.querySelector('#deckDenomSelect')!;
    this._spinBtn = this._container.querySelector('#deckSpinBtn')!;
    this._turboBtn = this._container.querySelector('#deckTurboBtn')!;
    this._autoSpinBtn = this._container.querySelector('#deckAutoSpinBtn')!;
    this._maxBetBtn = this._container.querySelector('#maxBetBtn')!;
    this._soundBtn = this._container.querySelector('#soundToggleBtn')!;
    this._autoSpinModal = this._container.querySelector('#autoSpinModal')!;
  }

  private bindEvents(): void {
    // 1. Spin Button Click
    this._spinBtn.addEventListener('click', () => {
      this._soundSystem.playUiClick();
      if (this._fsm.currentState === SlotState.IDLE || this._fsm.currentState === SlotState.FREE_SPINS) {
        this._onSpinRequested();
      }
    });

    // 2. Bet Level Adjusters
    const levelDownBtn = this._container.querySelector('#levelDownBtn')!;
    const levelUpBtn = this._container.querySelector('#levelUpBtn')!;

    levelDownBtn.addEventListener('click', () => {
      if (this._fsm.currentState !== SlotState.IDLE) return;
      this._soundSystem.playUiClick();
      const current = this._stateStore.getState().betLevel;
      const prev = [...BET_LEVELS].reverse().find((l) => l < current);
      if (prev) this._stateStore.setBetLevel(prev);
    });

    levelUpBtn.addEventListener('click', () => {
      if (this._fsm.currentState !== SlotState.IDLE) return;
      this._soundSystem.playUiClick();
      const current = this._stateStore.getState().betLevel;
      const next = BET_LEVELS.find((l) => l > current);
      if (next) this._stateStore.setBetLevel(next);
    });

    // 3. Denom Selection
    this._denomSelect.addEventListener('change', (e) => {
      if (this._fsm.currentState !== SlotState.IDLE) return;
      this._soundSystem.playUiClick();
      const target = e.target as HTMLSelectElement;
      this._stateStore.setDenom(parseInt(target.value, 10));
    });

    // 4. MAX BET Button
    this._maxBetBtn.addEventListener('click', () => {
      if (this._fsm.currentState !== SlotState.IDLE) return;
      this._soundSystem.playBigWinGong();
      const maxLevel = BET_LEVELS[BET_LEVELS.length - 1]; // Level 10
      const maxDenom = DENOM_PRESETS[DENOM_PRESETS.length - 1]; // Denom 10.000
      this._stateStore.setBetLevel(maxLevel);
      this._stateStore.setDenom(maxDenom);
      this._denomSelect.value = String(maxDenom);

      // Golden flash animation on bet display
      this._betEl.classList.add('animate-ping');
      setTimeout(() => this._betEl.classList.remove('animate-ping'), 400);
    });

    // 5. Sound Toggle
    this._soundBtn.addEventListener('click', () => {
      const isMuted = this._soundSystem.toggleMute();
      this._soundBtn.textContent = isMuted ? '🔇' : '🔊';
      this._soundBtn.className = `w-9 h-9 flex items-center justify-center rounded-xl border text-sm active:scale-95 transition-all ${
        isMuted ? 'border-rose-500 bg-rose-950/40 text-rose-300' : 'border-slate-700 bg-slate-900 text-amber-300'
      }`;
    });

    // 6. Turbo Toggle
    this._turboBtn.addEventListener('click', () => {
      this._soundSystem.playUiClick();
      const active = this._stateStore.toggleTurbo();
      this._turboBtn.className = `px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-black transition-all ${
        active
          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
          : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
      }`;
    });

    // 7. Auto Spin Modal Open / Close
    this._autoSpinBtn.addEventListener('click', () => {
      this._soundSystem.playUiClick();
      if (this._stateStore.getState().isAutoSpin) {
        // Stop active auto-spin
        this._stateStore.stopAutoSpin();
        this._autoSpinBtn.className = 'px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-black bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 transition-all';
        this._autoSpinBtn.textContent = '🔄 AUTO';
      } else {
        // Toggle options modal
        this._autoSpinModal.classList.toggle('hidden');
      }
    });

    const closeAutoModalBtn = this._container.querySelector('#closeAutoModalBtn')!;
    closeAutoModalBtn.addEventListener('click', () => {
      this._autoSpinModal.classList.add('hidden');
    });

    // Auto Spin Count Buttons (10, 50, 100, 999)
    const optButtons = this._container.querySelectorAll('.auto-opt-btn');
    optButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this._soundSystem.playUiClick();
        const count = parseInt((e.currentTarget as HTMLElement).getAttribute('data-spins') || '10', 10);
        this._autoSpinModal.classList.add('hidden');

        this._stateStore.startAutoSpin(count);
        this._autoSpinBtn.className = 'px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-black bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/30 animate-pulse transition-all';
        this._autoSpinBtn.textContent = `🔄 AUTO (${count === 999 ? '∞' : count})`;

        if (this._fsm.currentState === SlotState.IDLE) {
          this._onSpinRequested();
        }
      });
    });
  }

  private subscribeStore(): void {
    this._stateStore.subscribeKey('balance', (val) => {
      this._balanceEl.textContent = val.toLocaleString('id-ID');
    });

    this._stateStore.subscribeKey('currentBet', (val) => {
      this._betEl.textContent = val.toLocaleString('id-ID');
    });

    this._stateStore.subscribeKey('winAmount', (val) => {
      this._winEl.textContent = val.toLocaleString('id-ID');
    });

    this._stateStore.subscribeKey('betLevel', (val) => {
      this._betLevelEl.textContent = String(val);
    });

    this._stateStore.subscribeKey('autoSpinCount', (val) => {
      if (this._stateStore.getState().isAutoSpin) {
        this._autoSpinBtn.textContent = `🔄 AUTO (${val >= 900 ? '∞' : val})`;
      }
    });

    this._stateStore.subscribeKey('freeSpinsLeft', (val) => {
      const spinBtnText = this._container.querySelector('#spinBtnText')!;
      if (val > 0) {
        spinBtnText.textContent = `🔥 FREE (${val})`;
        this._spinBtn.className = 'relative group px-6 sm:px-9 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-rose-500/40 active:scale-95 transition-all border-2 border-rose-300 animate-pulse';
      } else if (this._fsm.currentState === SlotState.IDLE) {
        spinBtnText.textContent = '🎲 PUTAR';
        this._spinBtn.className = 'relative group px-6 sm:px-9 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-amber-500/30 active:scale-95 transition-all border-2 border-yellow-200';
      }
    });
  }

  private bindFsm(): void {
    this._fsm.onStateChange(() => {
      this.syncVisuals();
    });
  }

  /**
   * Synchronizes button visuals and interactive states with active FSM and wallet state.
   */
  public syncVisuals(): void {
    const spinBtnText = this._container.querySelector('#spinBtnText');
    if (!spinBtnText) return;

    const state = this._fsm.currentState;
    const s = this._stateStore.getState();

    if (state === SlotState.FREE_SPINS || s.freeSpinsLeft > 0) {
      this._spinBtn.disabled = false;
      spinBtnText.textContent = `🔥 FREE (${s.freeSpinsLeft})`;
      this._spinBtn.className =
        'relative group px-6 sm:px-9 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-rose-500/40 active:scale-95 transition-all border-2 border-rose-300 animate-pulse';
    } else if (
      state === SlotState.SPINNING ||
      state === SlotState.ANTICIPATION ||
      state === SlotState.STOPPING ||
      state === SlotState.EVALUATING
    ) {
      this._spinBtn.disabled = true;
      spinBtnText.textContent = '⏳ BERPUTAR';
    } else if (state === SlotState.JACKPOT_BONUS) {
      this._spinBtn.disabled = true;
      spinBtnText.textContent = '🎰 BONUS';
    } else {
      this._spinBtn.disabled = false;
      spinBtnText.textContent = '🎲 PUTAR';
      this._spinBtn.className =
        'relative group px-6 sm:px-9 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-amber-500/30 active:scale-95 transition-all border-2 border-yellow-200';
    }
  }

  /**
   * Optional helper to mark readiness; guarantees visuals are always properly synced.
   */
  public setReady(_ready: boolean): void {
    this.syncVisuals();
  }
}
