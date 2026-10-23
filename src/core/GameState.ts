/**
 * SlotKita - Reactive Game State Store
 * Phase 2: State Architecture & Reactive Store
 */

import { SpinResult } from '../math/Types';
import { BASE_BET } from '../math/Paytable';

export interface IGameState {
  balance: number;
  currentBet: number;
  betLevel: number;
  denom: number;
  winAmount: number;
  isTurbo: boolean;
  isAutoSpin: boolean;
  autoSpinCount: number;
  freeSpinsLeft: number;
  totalFreeSpinsWon: number;
  currentRoundData: SpinResult | null;
}

export type StateListener = (state: Readonly<IGameState>) => void;
export type KeyListener<K extends keyof IGameState> = (val: IGameState[K], prevVal: IGameState[K]) => void;
export type Unsubscribe = () => void;

/**
 * Standard preset bet levels and denominations
 */
export const BET_LEVELS = [1, 2, 3, 5, 10, 20, 50] as const;
export const DENOM_PRESETS = [1000, 2000, 5000, 10000, 20000] as const;

/**
 * Default initial state configuration
 */
export const DEFAULT_INITIAL_STATE: Readonly<IGameState> = {
  balance: 10_000_000, // 10 Juta Koin awal
  currentBet: 100_000, // Default 100k (BASE_BET 50 * betLevel 1 * denom 2000)
  betLevel: 1,
  denom: 2_000,
  winAmount: 0,
  isTurbo: false,
  isAutoSpin: false,
  autoSpinCount: 0,
  freeSpinsLeft: 0,
  totalFreeSpinsWon: 0,
  currentRoundData: null,
};

/**
 * Centralized reactive store for slot game state.
 */
export class GameStateStore {
  private _state: IGameState;
  private _globalListeners: Set<StateListener> = new Set();
  private _keyListeners: Map<keyof IGameState, Set<KeyListener<any>>> = new Map();

  constructor(initialState: Partial<IGameState> = {}) {
    this._state = {
      ...DEFAULT_INITIAL_STATE,
      ...initialState,
    };
    // Recalculate currentBet based on betLevel & denom
    this._state.currentBet = this.calculateTotalBet(this._state.betLevel, this._state.denom);
  }

  /**
   * Returns an immutable snapshot of the current state.
   */
  public getState(): Readonly<IGameState> {
    return { ...this._state };
  }

  /**
   * Calculates total bet from bet level and denomination.
   * Total Bet = BASE_BET (50) * betLevel * denom
   */
  public calculateTotalBet(betLevel: number, denom: number): number {
    return BASE_BET * betLevel * denom;
  }

  /**
   * Atomically deducts current bet from balance.
   *
   * @returns boolean true if balance was sufficient and deducted, false otherwise
   */
  public deductBet(): boolean {
    if (this._state.balance < this._state.currentBet) {
      console.warn(
        `[GameState] Insufficient balance: Available ${this._state.balance}, Bet Required ${this._state.currentBet}`
      );
      return false;
    }

    const prevBalance = this._state.balance;
    this._state.balance -= this._state.currentBet;
    this._state.winAmount = 0; // Reset last win on new spin

    this.notifyKey('balance', this._state.balance, prevBalance);
    this.notifyKey('winAmount', 0, this._state.winAmount);
    this.notifyGlobal();

    return true;
  }

  /**
   * Atomically credits win amount to player balance.
   * If in Free Spins, also accumulates into totalFreeSpinsWon.
   *
   * @param amount Win amount in coins
   */
  public creditWin(amount: number): void {
    if (amount <= 0) return;

    const prevBalance = this._state.balance;
    const prevWin = this._state.winAmount;
    const prevFsWon = this._state.totalFreeSpinsWon;

    this._state.balance += amount;
    this._state.winAmount = amount;

    if (this._state.freeSpinsLeft > 0) {
      this._state.totalFreeSpinsWon += amount;
      this.notifyKey('totalFreeSpinsWon', this._state.totalFreeSpinsWon, prevFsWon);
    }

    this.notifyKey('balance', this._state.balance, prevBalance);
    this.notifyKey('winAmount', this._state.winAmount, prevWin);
    this.notifyGlobal();
  }

  /**
   * Updates bet level and recalculates total bet.
   */
  public setBetLevel(level: number): void {
    if (level <= 0) return;
    const prevLevel = this._state.betLevel;
    const prevBet = this._state.currentBet;

    this._state.betLevel = level;
    this._state.currentBet = this.calculateTotalBet(this._state.betLevel, this._state.denom);

    this.notifyKey('betLevel', this._state.betLevel, prevLevel);
    this.notifyKey('currentBet', this._state.currentBet, prevBet);
    this.notifyGlobal();
  }

  /**
   * Updates denomination and recalculates total bet.
   */
  public setDenom(denom: number): void {
    if (denom <= 0) return;
    const prevDenom = this._state.denom;
    const prevBet = this._state.currentBet;

    this._state.denom = denom;
    this._state.currentBet = this.calculateTotalBet(this._state.betLevel, this._state.denom);

    this.notifyKey('denom', this._state.denom, prevDenom);
    this.notifyKey('currentBet', this._state.currentBet, prevBet);
    this.notifyGlobal();
  }

  /**
   * Toggles Turbo Spin mode.
   */
  public toggleTurbo(): boolean {
    const prev = this._state.isTurbo;
    this._state.isTurbo = !prev;
    this.notifyKey('isTurbo', this._state.isTurbo, prev);
    this.notifyGlobal();
    return this._state.isTurbo;
  }

  /**
   * Activates auto spin with a specified count.
   */
  public startAutoSpin(count: number): void {
    const prevAuto = this._state.isAutoSpin;
    const prevCount = this._state.autoSpinCount;

    this._state.isAutoSpin = true;
    this._state.autoSpinCount = Math.max(0, count);

    this.notifyKey('isAutoSpin', true, prevAuto);
    this.notifyKey('autoSpinCount', this._state.autoSpinCount, prevCount);
    this.notifyGlobal();
  }

  /**
   * Cancels active auto spin.
   */
  public stopAutoSpin(): void {
    if (!this._state.isAutoSpin) return;

    const prevAuto = this._state.isAutoSpin;
    const prevCount = this._state.autoSpinCount;

    this._state.isAutoSpin = false;
    this._state.autoSpinCount = 0;

    this.notifyKey('isAutoSpin', false, prevAuto);
    this.notifyKey('autoSpinCount', 0, prevCount);
    this.notifyGlobal();
  }

  /**
   * Decrements auto spin counter by 1.
   * Automatically stops auto spin when count reaches 0.
   *
   * @returns boolean true if auto spin should continue, false if finished
   */
  public decrementAutoSpin(): boolean {
    if (!this._state.isAutoSpin || this._state.autoSpinCount <= 0) {
      this.stopAutoSpin();
      return false;
    }

    const prevCount = this._state.autoSpinCount;
    this._state.autoSpinCount--;

    this.notifyKey('autoSpinCount', this._state.autoSpinCount, prevCount);

    if (this._state.autoSpinCount === 0) {
      this.stopAutoSpin();
      return false;
    }

    this.notifyGlobal();
    return true;
  }

  /**
   * Awards Free Spins to the player.
   */
  public awardFreeSpins(count: number): void {
    if (count <= 0) return;
    const prevFs = this._state.freeSpinsLeft;
    this._state.freeSpinsLeft += count;

    this.notifyKey('freeSpinsLeft', this._state.freeSpinsLeft, prevFs);
    this.notifyGlobal();
  }

  /**
   * Consumes 1 Free Spin from remaining bonus spins.
   *
   * @returns boolean true if spin was consumed, false if no free spins left
   */
  public consumeFreeSpin(): boolean {
    if (this._state.freeSpinsLeft <= 0) {
      return false;
    }

    const prevFs = this._state.freeSpinsLeft;
    this._state.freeSpinsLeft--;

    this.notifyKey('freeSpinsLeft', this._state.freeSpinsLeft, prevFs);
    this.notifyGlobal();

    return true;
  }

  /**
   * Resets Free Spins session counters upon completion.
   */
  public resetFreeSpinsSession(): void {
    const prevFs = this._state.freeSpinsLeft;
    const prevWon = this._state.totalFreeSpinsWon;

    this._state.freeSpinsLeft = 0;
    this._state.totalFreeSpinsWon = 0;

    this.notifyKey('freeSpinsLeft', 0, prevFs);
    this.notifyKey('totalFreeSpinsWon', 0, prevWon);
    this.notifyGlobal();
  }

  /**
   * Updates current spin result data.
   */
  public setCurrentRound(result: SpinResult | null): void {
    const prev = this._state.currentRoundData;
    this._state.currentRoundData = result;
    this.notifyKey('currentRoundData', result, prev);
    this.notifyGlobal();
  }

  /**
   * Restores state partially (used during session recovery from localStorage).
   */
  public restoreState(restored: Partial<IGameState>): void {
    this._state = {
      ...this._state,
      ...restored,
    };
    // Ensure bet matches restored betLevel & denom
    this._state.currentBet = this.calculateTotalBet(this._state.betLevel, this._state.denom);
    this.notifyGlobal();
  }

  /**
   * Subscribes to any state change across the store.
   */
  public subscribe(listener: StateListener): Unsubscribe {
    this._globalListeners.add(listener);
    return () => {
      this._globalListeners.delete(listener);
    };
  }

  /**
   * Subscribes to changes on a specific key of the state.
   */
  public subscribeKey<K extends keyof IGameState>(key: K, listener: KeyListener<K>): Unsubscribe {
    if (!this._keyListeners.has(key)) {
      this._keyListeners.set(key, new Set());
    }
    const set = this._keyListeners.get(key)!;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  private notifyGlobal(): void {
    const snapshot = this.getState();
    for (const listener of this._globalListeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[GameState] Error in global listener:', err);
      }
    }
  }

  private notifyKey<K extends keyof IGameState>(key: K, val: IGameState[K], prevVal: IGameState[K]): void {
    const set = this._keyListeners.get(key);
    if (!set) return;

    for (const listener of set) {
      try {
        listener(val, prevVal);
      } catch (err) {
        console.error(`[GameState] Error in key listener for '${String(key)}':`, err);
      }
    }
  }
}
