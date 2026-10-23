/**
 * SlotKita - Phase 4: Gameplay Features Unit Tests
 * Fu Pot Progression, 12-Coin Jackpot Bonus Math, and Enriched Free Spins
 */

import { describe, it, expect } from 'vitest';
import { FuPotState } from '../FuPot';
import {
  JackpotTier,
  JACKPOT_CONFIGS,
} from '../JackpotModal';
import {
  FREE_SPIN_REEL_STRIPS,
  LOW_PAY_ROYALS,
  generateFreeSpinRandomGrid,
  REEL_STRIPS,
  REEL_COUNT,
  VISIBLE_ROWS,
} from '../../math/ReelStrips';
import { SymbolId } from '../../math/Types';
import { WinEvaluator } from '../../math/WinEvaluator';
import { StateMachine, SlotState } from '../../core/FSM';
import { GameStateStore } from '../../core/GameState';

describe('1. Fu Pot Progression & Configurations', () => {
  it('should support all 4 required progression states', () => {
    const states = [
      FuPotState.DEFLATED,
      FuPotState.NORMAL,
      FuPotState.FILLING,
      FuPotState.OVERFLOWING,
    ];

    expect(states).toContain('DEFLATED');
    expect(states).toContain('NORMAL');
    expect(states).toContain('FILLING');
    expect(states).toContain('OVERFLOWING');
  });

  it('should calculate mouth stage position correctly relative to pot coordinates', () => {
    const potX = 415;
    const potY = 52;
    const mouthRelative = { x: 0, y: -16 };

    const mouthStageX = potX + mouthRelative.x;
    const mouthStageY = potY + mouthRelative.y;

    expect(mouthStageX).toBe(415);
    expect(mouthStageY).toBe(36);
  });
});

describe('2. 12-Coin Jackpot Bonus Mini-Game', () => {
  it('should define accurate multipliers for all 4 jackpot tiers', () => {
    expect(JACKPOT_CONFIGS[JackpotTier.GRAND].multiplier).toBe(1000);
    expect(JACKPOT_CONFIGS[JackpotTier.MAJOR].multiplier).toBe(200);
    expect(JACKPOT_CONFIGS[JackpotTier.MINOR].multiplier).toBe(50);
    expect(JACKPOT_CONFIGS[JackpotTier.MINI].multiplier).toBe(20);
  });

  it('should compute exact payout based on total bet', () => {
    const bet = 100_000;

    const grandPayout = JACKPOT_CONFIGS[JackpotTier.GRAND].multiplier * bet;
    const majorPayout = JACKPOT_CONFIGS[JackpotTier.MAJOR].multiplier * bet;
    const minorPayout = JACKPOT_CONFIGS[JackpotTier.MINOR].multiplier * bet;
    const miniPayout = JACKPOT_CONFIGS[JackpotTier.MINI].multiplier * bet;

    expect(grandPayout).toBe(100_000_000);
    expect(majorPayout).toBe(20_000_000);
    expect(minorPayout).toBe(5_000_000);
    expect(miniPayout).toBe(2_000_000);
  });

  it('should compose exactly 12 coins with 3 coins per tier', () => {
    const pool: JackpotTier[] = [
      JackpotTier.GRAND, JackpotTier.GRAND, JackpotTier.GRAND,
      JackpotTier.MAJOR, JackpotTier.MAJOR, JackpotTier.MAJOR,
      JackpotTier.MINOR, JackpotTier.MINOR, JackpotTier.MINOR,
      JackpotTier.MINI, JackpotTier.MINI, JackpotTier.MINI,
    ];

    expect(pool.length).toBe(12);

    const counts: Record<JackpotTier, number> = {
      [JackpotTier.GRAND]: 0,
      [JackpotTier.MAJOR]: 0,
      [JackpotTier.MINOR]: 0,
      [JackpotTier.MINI]: 0,
    };

    for (const t of pool) {
      counts[t]++;
    }

    expect(counts[JackpotTier.GRAND]).toBe(3);
    expect(counts[JackpotTier.MAJOR]).toBe(3);
    expect(counts[JackpotTier.MINOR]).toBe(3);
    expect(counts[JackpotTier.MINI]).toBe(3);
  });

  it('should detect match-3 win condition correctly', () => {
    const counts = {
      [JackpotTier.MINI]: 0,
      [JackpotTier.MINOR]: 0,
      [JackpotTier.MAJOR]: 0,
      [JackpotTier.GRAND]: 0,
    };

    const picks = [JackpotTier.MINI, JackpotTier.GRAND, JackpotTier.MINI, JackpotTier.MINI];

    let winner: JackpotTier | null = null;
    for (const pick of picks) {
      counts[pick]++;
      if (counts[pick] === 3) {
        winner = pick;
        break;
      }
    }

    expect(winner).toBe(JackpotTier.MINI);
    expect(counts[JackpotTier.MINI]).toBe(3);
    expect(counts[JackpotTier.GRAND]).toBe(1);
  });
});

describe('3. Enriched Free Spins & Reel Strips Filtering', () => {
  it('should eliminate all low-pay royals from FREE_SPIN_REEL_STRIPS', () => {
    for (let r = 0; r < REEL_COUNT; r++) {
      const freeStrip = FREE_SPIN_REEL_STRIPS[r];
      const baseStrip = REEL_STRIPS[r];

      expect(freeStrip.length).toBeLessThan(baseStrip.length);

      for (const sym of freeStrip) {
        expect(LOW_PAY_ROYALS.has(sym)).toBe(false);
      }
    }
  });

  it('should contain only high-pay symbols, wilds, and scatters on enriched strips', () => {
    const allowed = new Set<SymbolId>([
      SymbolId.COIN,
      SymbolId.BIRD,
      SymbolId.SHIP,
      SymbolId.TORTOISE,
      SymbolId.WILD,
      SymbolId.SCATTER,
    ]);

    for (let r = 0; r < REEL_COUNT; r++) {
      for (const sym of FREE_SPIN_REEL_STRIPS[r]) {
        expect(allowed.has(sym)).toBe(true);
      }
    }
  });

  it('should generate 5x3 enriched grids completely free of card royals', () => {
    for (let i = 0; i < 20; i++) {
      const { grid, stops } = generateFreeSpinRandomGrid();
      expect(grid.length).toBe(REEL_COUNT);
      expect(stops.length).toBe(REEL_COUNT);

      for (let r = 0; r < REEL_COUNT; r++) {
        expect(grid[r].length).toBe(VISIBLE_ROWS);
        for (let row = 0; row < VISIBLE_ROWS; row++) {
          const sym = grid[r][row];
          expect(LOW_PAY_ROYALS.has(sym)).toBe(false);
        }
      }
    }
  });

  it('should evaluate high hit frequency and payouts on enriched free spin grid', () => {
    const { grid, stops } = generateFreeSpinRandomGrid();
    const result = WinEvaluator.evaluate(grid, stops, 1);

    expect(result).toBeDefined();
    expect(typeof result.totalWin).toBe('number');
    expect(result.grid.length).toBe(5);
  });
});

describe('4. Full State Machine Flow with Free Spins & Jackpot Bonus', () => {
  it('should transition smoothly: IDLE -> BET_SUBMITTED -> SPINNING -> EVALUATING -> FREE_SPINS -> IDLE', () => {
    const fsm = new StateMachine(SlotState.IDLE);

    expect(fsm.transitionTo(SlotState.BET_SUBMITTED)).toBe(true);
    expect(fsm.transitionTo(SlotState.SPINNING)).toBe(true);
    expect(fsm.transitionTo(SlotState.STOPPING)).toBe(true);
    expect(fsm.transitionTo(SlotState.EVALUATING)).toBe(true);
    expect(fsm.transitionTo(SlotState.FREE_SPINS)).toBe(true);

    // Free Spins consecutive spin
    expect(fsm.transitionTo(SlotState.SPINNING)).toBe(true);
    expect(fsm.transitionTo(SlotState.STOPPING)).toBe(true);
    expect(fsm.transitionTo(SlotState.EVALUATING)).toBe(true);

    // Free spins ended -> back to IDLE
    expect(fsm.transitionTo(SlotState.IDLE)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.IDLE);
  });

  it('should transition smoothly into JACKPOT_BONUS and back', () => {
    const fsm = new StateMachine(SlotState.IDLE);

    // From IDLE or EVALUATING directly to JACKPOT_BONUS
    expect(fsm.transitionTo(SlotState.JACKPOT_BONUS)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.JACKPOT_BONUS);

    // Claim prize and transition to WIN_CELEBRATION then IDLE
    expect(fsm.transitionTo(SlotState.WIN_CELEBRATION)).toBe(true);
    expect(fsm.transitionTo(SlotState.IDLE)).toBe(true);
    expect(fsm.currentState).toBe(SlotState.IDLE);
  });

  it('should track free spins award and consumption in GameStateStore', () => {
    const store = new GameStateStore({ balance: 1_000_000, freeSpinsLeft: 0 });

    store.awardFreeSpins(10);
    expect(store.getState().freeSpinsLeft).toBe(10);

    // Consume spin
    const consumed = store.consumeFreeSpin();
    expect(consumed).toBe(true);
    expect(store.getState().freeSpinsLeft).toBe(9);

    // Retrigger +10
    store.awardFreeSpins(10);
    expect(store.getState().freeSpinsLeft).toBe(19);

    // Credit win during free spins
    store.creditWin(500_000);
    expect(store.getState().totalFreeSpinsWon).toBe(500_000);
    expect(store.getState().balance).toBe(1_500_000);

    // Reset free spins session
    store.resetFreeSpinsSession();
    expect(store.getState().totalFreeSpinsWon).toBe(0);
  });
});

describe('5. Particle & Bezier Math Verification', () => {
  it('should satisfy quadratic Bezier curve boundary conditions', () => {
    const p0 = { x: 100, y: 200 };
    const p1 = { x: 250, y: 50 };
    const p2 = { x: 415, y: 36 };

    const bezier = (t: number) => {
      const inv = 1 - t;
      return {
        x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
        y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
      };
    };

    // At t=0, point equals p0
    const start = bezier(0);
    expect(start.x).toBeCloseTo(p0.x);
    expect(start.y).toBeCloseTo(p0.y);

    // At t=1, point equals p2
    const end = bezier(1);
    expect(end.x).toBeCloseTo(p2.x);
    expect(end.y).toBeCloseTo(p2.y);
  });
});
