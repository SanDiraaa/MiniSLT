/**
 * SlotKita - Core Architecture & State Machine Unit Tests
 * Complete test suite for FSM transitions, GameState store, and Session Persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SlotState, StateMachine } from '../FSM';
import { GameStateStore, DEFAULT_INITIAL_STATE } from '../GameState';
import { SessionPersistence, storage, STORAGE_KEY } from '../Persistence';

describe('1. Finite State Machine (FSM)', () => {
  let fsm: StateMachine;

  beforeEach(() => {
    fsm = new StateMachine();
  });

  it('should initialize with default IDLE state', () => {
    expect(fsm.currentState).toBe(SlotState.IDLE);
    expect(fsm.previousState).toBe(SlotState.IDLE);
  });

  it('should allow valid transitions according to slot lifecycle', () => {
    // IDLE -> BET_SUBMITTED -> SPINNING -> STOPPING -> EVALUATING -> WIN_CELEBRATION -> IDLE
    expect(fsm.canTransitionTo(SlotState.BET_SUBMITTED)).toBe(true);
    expect(fsm.transitionTo(SlotState.BET_SUBMITTED)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.BET_SUBMITTED);

    expect(fsm.canTransitionTo(SlotState.SPINNING)).toBe(true);
    expect(fsm.transitionTo(SlotState.SPINNING)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.SPINNING);

    expect(fsm.canTransitionTo(SlotState.STOPPING)).toBe(true);
    expect(fsm.transitionTo(SlotState.STOPPING)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.STOPPING);

    expect(fsm.canTransitionTo(SlotState.EVALUATING)).toBe(true);
    expect(fsm.transitionTo(SlotState.EVALUATING)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.EVALUATING);

    expect(fsm.canTransitionTo(SlotState.WIN_CELEBRATION)).toBe(true);
    expect(fsm.transitionTo(SlotState.WIN_CELEBRATION)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.WIN_CELEBRATION);

    expect(fsm.canTransitionTo(SlotState.IDLE)).toBe(true);
    expect(fsm.transitionTo(SlotState.IDLE)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.IDLE);
  });

  it('should support anticipation tension state during spin', () => {
    fsm.transitionTo(SlotState.BET_SUBMITTED);
    fsm.transitionTo(SlotState.SPINNING);

    expect(fsm.canTransitionTo(SlotState.ANTICIPATION)).toBe(true);
    expect(fsm.transitionTo(SlotState.ANTICIPATION)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.ANTICIPATION);

    expect(fsm.canTransitionTo(SlotState.STOPPING)).toBe(true);
    expect(fsm.transitionTo(SlotState.STOPPING)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.STOPPING);
  });

  it('should reject illegal transitions deterministically', () => {
    // Cannot jump from IDLE to STOPPING directly
    expect(fsm.canTransitionTo(SlotState.STOPPING)).toBe(false);
    expect(fsm.transitionTo(SlotState.STOPPING)).toBe(false);
    expect(fsm.currentState).toBe(SlotState.IDLE);

    // Transition to BET_SUBMITTED then try jumping to EVALUATING
    fsm.transitionTo(SlotState.BET_SUBMITTED);
    expect(fsm.canTransitionTo(SlotState.EVALUATING)).toBe(false);
    expect(fsm.transitionTo(SlotState.EVALUATING)).toBe(false);
    expect(fsm.currentState).toBe(SlotState.BET_SUBMITTED);
  });

  it('should emit onStateEnter, onStateExit, and onStateChange events with payload', () => {
    let enterCalled = false;
    let exitCalled = false;
    let changeCalled = false;
    let receivedPayload: any = null;

    fsm.onStateExit(SlotState.IDLE, (from, to) => {
      expect(from).toBe(SlotState.IDLE);
      expect(to).toBe(SlotState.BET_SUBMITTED);
      exitCalled = true;
    });

    fsm.onStateEnter(SlotState.BET_SUBMITTED, (to, from, payload) => {
      expect(to).toBe(SlotState.BET_SUBMITTED);
      expect(from).toBe(SlotState.IDLE);
      receivedPayload = payload;
      enterCalled = true;
    });

    fsm.onStateChange((to, from, payload) => {
      changeCalled = true;
      expect(to).toBe(SlotState.BET_SUBMITTED);
      expect(from).toBe(SlotState.IDLE);
      expect(payload).toEqual({ bet: 100000 });
    });

    fsm.transitionTo(SlotState.BET_SUBMITTED, { bet: 100000 });

    expect(exitCalled).toBe(true);
    expect(enterCalled).toBe(true);
    expect(changeCalled).toBe(true);
    expect(receivedPayload).toEqual({ bet: 100000 });
  });

  it('should allow unsubscribing from event listeners', () => {
    let callCount = 0;
    const unsubscribe = fsm.onStateEnter(SlotState.BET_SUBMITTED, () => {
      callCount++;
    });

    fsm.transitionTo(SlotState.BET_SUBMITTED);
    expect(callCount).toBe(1);

    unsubscribe();

    fsm.transitionTo(SlotState.IDLE);
    fsm.transitionTo(SlotState.BET_SUBMITTED);
    expect(callCount).toBe(1); // Not called after unsubscribe
  });
});

describe('2. GameState Store & Atomic Methods', () => {
  let store: GameStateStore;

  beforeEach(() => {
    store = new GameStateStore();
  });

  it('should initialize with 10.000.000 balance and 100.000 currentBet', () => {
    const state = store.getState();
    expect(state.balance).toBe(10_000_000);
    expect(state.currentBet).toBe(100_000);
    expect(state.betLevel).toBe(1);
    expect(state.denom).toBe(2_000);
    expect(state.winAmount).toBe(0);
    expect(state.freeSpinsLeft).toBe(0);
  });

  it('should atomically deduct bet when balance is sufficient', () => {
    const success = store.deductBet();
    expect(success).toBe(true);

    const state = store.getState();
    expect(state.balance).toBe(9_900_000);
  });

  it('should reject deductBet when balance is insufficient', () => {
    const brokeStore = new GameStateStore({ balance: 50_000, currentBet: 100_000 });
    const success = brokeStore.deductBet();

    expect(success).toBe(false);
    expect(brokeStore.getState().balance).toBe(50_000); // Unchanged
  });

  it('should atomically credit win and update balance', () => {
    store.deductBet(); // 9.900.000
    store.creditWin(500_000);

    const state = store.getState();
    expect(state.balance).toBe(10_400_000);
    expect(state.winAmount).toBe(500_000);
  });

  it('should accumulate totalFreeSpinsWon when creditWin is called during Free Spins', () => {
    store.awardFreeSpins(10);
    expect(store.getState().freeSpinsLeft).toBe(10);

    store.creditWin(250_000);
    store.creditWin(150_000);

    const state = store.getState();
    expect(state.totalFreeSpinsWon).toBe(400_000);
  });

  it('should recalculate total bet when betLevel or denom changes', () => {
    // Bet = BASE_BET (50) * betLevel * denom
    store.setBetLevel(2);
    expect(store.getState().currentBet).toBe(50 * 2 * 2000); // 200.000

    store.setDenom(5000);
    expect(store.getState().currentBet).toBe(50 * 2 * 5000); // 500.000
  });

  it('should support auto-spin decrement and termination', () => {
    store.startAutoSpin(3);
    expect(store.getState().isAutoSpin).toBe(true);
    expect(store.getState().autoSpinCount).toBe(3);

    expect(store.decrementAutoSpin()).toBe(true);
    expect(store.getState().autoSpinCount).toBe(2);

    expect(store.decrementAutoSpin()).toBe(true);
    expect(store.getState().autoSpinCount).toBe(1);

    expect(store.decrementAutoSpin()).toBe(false); // Finished!
    expect(store.getState().isAutoSpin).toBe(false);
    expect(store.getState().autoSpinCount).toBe(0);
  });

  it('should notify key subscribers reactively on balance change', () => {
    let notifiedVal = 0;
    let prevNotifiedVal = 0;

    store.subscribeKey('balance', (val, prevVal) => {
      notifiedVal = val;
      prevNotifiedVal = prevVal;
    });

    store.deductBet();
    expect(notifiedVal).toBe(9_900_000);
    expect(prevNotifiedVal).toBe(10_000_000);

    store.creditWin(200_000);
    expect(notifiedVal).toBe(10_100_000);
    expect(prevNotifiedVal).toBe(9_900_000);
  });
});

describe('3. Session Persistence & Recovery', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('should persist game state and FSM state into storage', () => {
    const store = new GameStateStore({ balance: 8_500_000 });
    SessionPersistence.saveSession(store.getState(), SlotState.IDLE);

    expect(SessionPersistence.hasSavedSession()).toBe(true);

    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw!);
    expect(parsed.balance).toBe(8_500_000);
    expect(parsed.lastState).toBe(SlotState.IDLE);
  });

  it('should recover regular session into IDLE state', () => {
    const store = new GameStateStore({ balance: 9_250_000, betLevel: 2 });
    SessionPersistence.saveSession(store.getState(), SlotState.IDLE);

    const recovery = SessionPersistence.recoverSession();
    expect(recovery.isRecovered).toBe(true);
    expect(recovery.stateToResume).toBe(SlotState.IDLE);
    expect(recovery.wasInFreeSpins).toBe(false);
    expect(recovery.recoveredData.balance).toBe(9_250_000);
    expect(recovery.recoveredData.betLevel).toBe(2);
  });

  it('should recover interrupted Free Spins session into FREE_SPINS state', () => {
    // Player is in the middle of 7 remaining Free Spins
    const store = new GameStateStore({
      balance: 11_500_000,
      freeSpinsLeft: 7,
      totalFreeSpinsWon: 1_200_000,
    });

    SessionPersistence.saveSession(store.getState(), SlotState.FREE_SPINS);

    // Simulate page reload
    const recovery = SessionPersistence.recoverSession();

    expect(recovery.isRecovered).toBe(true);
    expect(recovery.wasInFreeSpins).toBe(true);
    expect(recovery.stateToResume).toBe(SlotState.FREE_SPINS);
    expect(recovery.recoveredData.freeSpinsLeft).toBe(7);
    expect(recovery.recoveredData.totalFreeSpinsWon).toBe(1_200_000);
    expect(recovery.recoveredData.balance).toBe(11_500_000);
  });

  it('should handle corrupted storage gracefully and fallback to defaults', () => {
    storage.setItem(STORAGE_KEY, '{ invalid_json ::: corrupted');

    const recovery = SessionPersistence.recoverSession();
    expect(recovery.isRecovered).toBe(false);
    expect(recovery.stateToResume).toBe(SlotState.IDLE);
    expect(recovery.recoveredData.balance).toBe(DEFAULT_INITIAL_STATE.balance);
    expect(storage.getItem(STORAGE_KEY)).toBeNull(); // Removed corrupted key
  });
});
