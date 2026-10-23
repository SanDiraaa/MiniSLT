/**
 * SlotKita - Session Persistence & Recovery Engine
 * Phase 2: LocalStorage Session Preservation & Free Spins State Restoration
 */

import { SlotState, StateMachine } from './FSM';
import { IGameState, GameStateStore, DEFAULT_INITIAL_STATE } from './GameState';
import { SpinResult } from '../math/Types';

export const STORAGE_KEY = 'SLOTKITA_SESSION_V1';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Serialized session schema saved to storage.
 */
export interface IPersistedSession {
  version: number;
  balance: number;
  freeSpinsLeft: number;
  totalFreeSpinsWon: number;
  currentBet: number;
  betLevel: number;
  denom: number;
  isTurbo: boolean;
  currentRoundData: SpinResult | null;
  lastState: SlotState;
  timestamp: number;
}

/**
 * Result returned by recoverSession().
 */
export interface SessionRecoveryResult {
  isRecovered: boolean;
  stateToResume: SlotState;
  recoveredData: Partial<IGameState>;
  wasInFreeSpins: boolean;
  message: string;
}

/**
 * Cross-platform storage provider wrapper (safely handles Node.js test runner & Browser localStorage).
 */
class StorageAdapter {
  private _memoryFallback: Map<string, string> = new Map();

  public isAvailable(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return true;
      }
    } catch {
      // Storage unavailable or disabled
    }
    return false;
  }

  public getItem(key: string): string | null {
    if (this.isAvailable()) {
      return window.localStorage.getItem(key);
    }
    return this._memoryFallback.get(key) || null;
  }

  public setItem(key: string, value: string): void {
    if (this.isAvailable()) {
      window.localStorage.setItem(key, value);
    } else {
      this._memoryFallback.set(key, value);
    }
  }

  public removeItem(key: string): void {
    if (this.isAvailable()) {
      window.localStorage.removeItem(key);
    } else {
      this._memoryFallback.delete(key);
    }
  }

  public clear(): void {
    if (this.isAvailable()) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    this._memoryFallback.clear();
  }
}

export const storage = new StorageAdapter();

export class SessionPersistence {
  /**
   * Saves critical player session data to storage.
   *
   * @param state Current snapshot of game state
   * @param currentState Current active FSM state
   */
  public static saveSession(state: Readonly<IGameState>, currentState: SlotState): void {
    try {
      const payload: IPersistedSession = {
        version: CURRENT_SCHEMA_VERSION,
        balance: state.balance,
        freeSpinsLeft: state.freeSpinsLeft,
        totalFreeSpinsWon: state.totalFreeSpinsWon,
        currentBet: state.currentBet,
        betLevel: state.betLevel,
        denom: state.denom,
        isTurbo: state.isTurbo,
        currentRoundData: state.currentRoundData,
        lastState: currentState,
        timestamp: Date.now(),
      };

      storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('[Persistence] Failed to serialize and save session:', err);
    }
  }

  /**
   * Recovers session from storage.
   * If player refreshed during Free Spins, resumes directly into FREE_SPINS state.
   */
  public static recoverSession(): SessionRecoveryResult {
    const rawData = storage.getItem(STORAGE_KEY);

    if (!rawData) {
      return {
        isRecovered: false,
        stateToResume: SlotState.IDLE,
        recoveredData: { ...DEFAULT_INITIAL_STATE },
        wasInFreeSpins: false,
        message: 'Tidak ada sesi sebelumnya. Memulai sesi baru.',
      };
    }

    try {
      const parsed: IPersistedSession = JSON.parse(rawData);

      // Validate schema version and basic sanity
      if (!parsed || typeof parsed.balance !== 'number' || parsed.balance < 0) {
        throw new Error('Data sesi korup atau format tidak valid');
      }

      const recoveredData: Partial<IGameState> = {
        balance: parsed.balance,
        freeSpinsLeft: parsed.freeSpinsLeft || 0,
        totalFreeSpinsWon: parsed.totalFreeSpinsWon || 0,
        currentBet: parsed.currentBet || DEFAULT_INITIAL_STATE.currentBet,
        betLevel: parsed.betLevel || DEFAULT_INITIAL_STATE.betLevel,
        denom: parsed.denom || DEFAULT_INITIAL_STATE.denom,
        isTurbo: Boolean(parsed.isTurbo),
        currentRoundData: parsed.currentRoundData || null,
        isAutoSpin: false, // Auto-spin should never auto-resume across page reloads for safety
        autoSpinCount: 0,
      };

      // Critical Recovery Check: Free Spins in progress
      const wasInFreeSpins =
        recoveredData.freeSpinsLeft! > 0 || parsed.lastState === SlotState.FREE_SPINS;

      if (wasInFreeSpins && recoveredData.freeSpinsLeft! > 0) {
        return {
          isRecovered: true,
          stateToResume: SlotState.FREE_SPINS,
          recoveredData,
          wasInFreeSpins: true,
          message: `Sesi Free Spins dipulihkan! ${recoveredData.freeSpinsLeft} putaran tersisa.`,
        };
      }

      return {
        isRecovered: true,
        stateToResume: SlotState.IDLE,
        recoveredData,
        wasInFreeSpins: false,
        message: `Sesi permainan berhasil dipulihkan. Saldo: ${recoveredData.balance?.toLocaleString()} koin.`,
      };
    } catch (err) {
      console.warn('[Persistence] Corrupted session discarded:', err);
      storage.removeItem(STORAGE_KEY);

      return {
        isRecovered: false,
        stateToResume: SlotState.IDLE,
        recoveredData: { ...DEFAULT_INITIAL_STATE },
        wasInFreeSpins: false,
        message: 'Data sesi korup telah direset ke nilai bawaan.',
      };
    }
  }

  /**
   * Clears saved session from storage.
   */
  public static clearSession(): void {
    storage.removeItem(STORAGE_KEY);
  }

  /**
   * Checks whether a saved session exists in storage.
   */
  public static hasSavedSession(): boolean {
    return storage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Automatically sets up persistence hooks that automatically save session on:
   * 1. Balance deduction / credit
   * 2. Free Spins award / consumption
   * 3. State transitions
   */
  public static setupAutoPersistence(
    stateStore: GameStateStore,
    fsm: StateMachine
  ): () => void {
    // Save on state transition
    const unbindFSM = fsm.onStateChange((to) => {
      SessionPersistence.saveSession(stateStore.getState(), to);
    });

    // Save on critical state changes
    const unbindStore = stateStore.subscribe((state) => {
      SessionPersistence.saveSession(state, fsm.currentState);
    });

    return () => {
      unbindFSM();
      unbindStore();
    };
  }
}
