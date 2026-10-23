/**
 * SlotKita - Finite State Machine (FSM)
 * Phase 2: Deterministic State Management & Event Bus
 */

/**
 * Strict enumeration of all valid game states in the slot lifecycle.
 */
export enum SlotState {
  IDLE = 'IDLE',
  BET_SUBMITTED = 'BET_SUBMITTED',
  SPINNING = 'SPINNING',
  ANTICIPATION = 'ANTICIPATION',
  STOPPING = 'STOPPING',
  EVALUATING = 'EVALUATING',
  WIN_CELEBRATION = 'WIN_CELEBRATION',
  FREE_SPINS = 'FREE_SPINS',
  JACKPOT_BONUS = 'JACKPOT_BONUS',
}

export type StateEnterListener<T = unknown> = (to: SlotState, from: SlotState, payload?: T) => void;
export type StateExitListener<T = unknown> = (from: SlotState, to: SlotState, payload?: T) => void;
export type StateChangeListener<T = unknown> = (to: SlotState, from: SlotState, payload?: T) => void;

export type Unsubscribe = () => void;

/**
 * Deterministic transition rules table.
 * Maps each state to its strictly allowed target states.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<SlotState, readonly SlotState[]>> = {
  [SlotState.IDLE]: [
    SlotState.BET_SUBMITTED,
    SlotState.FREE_SPINS,
    SlotState.JACKPOT_BONUS,
  ],
  [SlotState.BET_SUBMITTED]: [
    SlotState.SPINNING,
    SlotState.IDLE, // In case of rollback or cancellation
  ],
  [SlotState.SPINNING]: [
    SlotState.ANTICIPATION,
    SlotState.STOPPING,
    SlotState.EVALUATING,
    SlotState.IDLE, // Emergency recovery
  ],
  [SlotState.ANTICIPATION]: [
    SlotState.STOPPING,
    SlotState.EVALUATING,
    SlotState.IDLE, // Emergency recovery
  ],
  [SlotState.STOPPING]: [
    SlotState.EVALUATING,
    SlotState.IDLE, // Emergency recovery
  ],
  [SlotState.EVALUATING]: [
    SlotState.WIN_CELEBRATION,
    SlotState.FREE_SPINS,
    SlotState.JACKPOT_BONUS,
    SlotState.IDLE,
  ],
  [SlotState.WIN_CELEBRATION]: [
    SlotState.FREE_SPINS,
    SlotState.JACKPOT_BONUS,
    SlotState.IDLE,
  ],
  [SlotState.FREE_SPINS]: [
    SlotState.SPINNING,
    SlotState.EVALUATING,
    SlotState.WIN_CELEBRATION,
    SlotState.JACKPOT_BONUS,
    SlotState.IDLE, // Exiting Free Spins feature
  ],
  [SlotState.JACKPOT_BONUS]: [
    SlotState.WIN_CELEBRATION,
    SlotState.FREE_SPINS,
    SlotState.IDLE,
  ],
};

/**
 * High-performance deterministic Finite State Machine with decoupled event pub/sub.
 */
export class StateMachine {
  private _currentState: SlotState;
  private _previousState: SlotState;

  private _enterListeners: Map<SlotState, Set<StateEnterListener<any>>> = new Map();
  private _exitListeners: Map<SlotState, Set<StateExitListener<any>>> = new Map();
  private _globalChangeListeners: Set<StateChangeListener<any>> = new Set();

  constructor(initialState: SlotState = SlotState.IDLE) {
    this._currentState = initialState;
    this._previousState = initialState;
  }

  /**
   * Returns current active state.
   */
  public get currentState(): SlotState {
    return this._currentState;
  }

  /**
   * Returns previous state before the most recent transition.
   */
  public get previousState(): SlotState {
    return this._previousState;
  }

  /**
   * Checks whether transition from current state to target state is legally allowed.
   */
  public canTransitionTo(targetState: SlotState): boolean {
    const allowed = ALLOWED_TRANSITIONS[this._currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  /**
   * Performs an atomic state transition.
   * Emits exit event for old state, updates state, and emits enter event for new state.
   *
   * @param targetState Target destination state
   * @param payload Optional contextual data passed to listeners
   * @returns boolean true if transition succeeded, false if rejected
   */
  public transitionTo<T = unknown>(targetState: SlotState, payload?: T): boolean {
    if (!this.canTransitionTo(targetState)) {
      console.warn(
        `[FSM] Illegal transition rejected: Cannot transition from '${this._currentState}' to '${targetState}'.`
      );
      return false;
    }

    const fromState = this._currentState;

    // 1. Emit exit listeners for current state
    const exitSet = this._exitListeners.get(fromState);
    if (exitSet) {
      for (const listener of exitSet) {
        try {
          listener(fromState, targetState, payload);
        } catch (err) {
          console.error(`[FSM] Error in exit listener for '${fromState}':`, err);
        }
      }
    }

    // 2. Commit transition
    this._previousState = fromState;
    this._currentState = targetState;

    // 3. Emit enter listeners for target state
    const enterSet = this._enterListeners.get(targetState);
    if (enterSet) {
      for (const listener of enterSet) {
        try {
          listener(targetState, fromState, payload);
        } catch (err) {
          console.error(`[FSM] Error in enter listener for '${targetState}':`, err);
        }
      }
    }

    // 4. Emit global change listeners
    for (const listener of this._globalChangeListeners) {
      try {
        listener(targetState, fromState, payload);
      } catch (err) {
        console.error(`[FSM] Error in global change listener:`, err);
      }
    }

    return true;
  }

  /**
   * Forcefully overrides state (used strictly during session recovery or initialization).
   */
  public forceState<T = unknown>(newState: SlotState, payload?: T): void {
    const fromState = this._currentState;
    this._previousState = fromState;
    this._currentState = newState;

    const enterSet = this._enterListeners.get(newState);
    if (enterSet) {
      for (const listener of enterSet) {
        listener(newState, fromState, payload);
      }
    }

    for (const listener of this._globalChangeListeners) {
      listener(newState, fromState, payload);
    }
  }

  /**
   * Registers a listener triggered when entering a specific state.
   * Returns an unsubscribe function.
   */
  public onStateEnter<T = unknown>(state: SlotState, listener: StateEnterListener<T>): Unsubscribe {
    if (!this._enterListeners.has(state)) {
      this._enterListeners.set(state, new Set());
    }
    const set = this._enterListeners.get(state)!;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  /**
   * Registers a listener triggered when exiting a specific state.
   * Returns an unsubscribe function.
   */
  public onStateExit<T = unknown>(state: SlotState, listener: StateExitListener<T>): Unsubscribe {
    if (!this._exitListeners.has(state)) {
      this._exitListeners.set(state, new Set());
    }
    const set = this._exitListeners.get(state)!;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  /**
   * Registers a global listener triggered on any state transition.
   * Returns an unsubscribe function.
   */
  public onStateChange<T = unknown>(listener: StateChangeListener<T>): Unsubscribe {
    this._globalChangeListeners.add(listener);
    return () => {
      this._globalChangeListeners.delete(listener);
    };
  }

  /**
   * Clears all registered event listeners.
   */
  public clearListeners(): void {
    this._enterListeners.clear();
    this._exitListeners.clear();
    this._globalChangeListeners.clear();
  }
}
