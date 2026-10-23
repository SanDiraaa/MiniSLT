/**
 * SlotKita 243-Ways Math Engine - Unit Tests
 * Complete test suite for 243-ways evaluation, Wild substitution, Scatter bonus, and Reel Strips.
 */

import { describe, it, expect } from 'vitest';
import { SymbolId } from '../Types';
import {
  PAYTABLE,
  SCATTER_PAYTABLE,
  SYMBOL_CONFIGS,
  BASE_BET,
} from '../Paytable';
import {
  REEL_STRIPS,
  REEL_COUNT,
  buildGridFromStops,
  getReelDistribution,
} from '../ReelStrips';
import { WinEvaluator, PAYING_SYMBOLS } from '../WinEvaluator';
import { SlotSimulator } from '../Simulator';

describe('1. Paytable and Symbol Configurations', () => {
  it('should define payouts for all 10 paying symbols for 3x, 4x, and 5x matches', () => {
    expect(PAYING_SYMBOLS.length).toBe(10);

    for (const sym of PAYING_SYMBOLS) {
      const payout = PAYTABLE[sym];
      expect(payout[3]).toBeGreaterThan(0);
      expect(payout[4]).toBeGreaterThan(payout[3]);
      expect(payout[5]).toBeGreaterThan(payout[4]);
    }
  });

  it('should have 0 standalone line payout for WILD and SCATTER', () => {
    expect(PAYTABLE[SymbolId.WILD][3]).toBe(0);
    expect(PAYTABLE[SymbolId.WILD][4]).toBe(0);
    expect(PAYTABLE[SymbolId.WILD][5]).toBe(0);

    expect(PAYTABLE[SymbolId.SCATTER][3]).toBe(0);
    expect(PAYTABLE[SymbolId.SCATTER][4]).toBe(0);
    expect(PAYTABLE[SymbolId.SCATTER][5]).toBe(0);
  });

  it('should define scatter multipliers and free spins for 3, 4, 5 scatters', () => {
    expect(SCATTER_PAYTABLE[3].payoutMultiplier).toBe(5);
    expect(SCATTER_PAYTABLE[3].freeSpins).toBe(10);

    expect(SCATTER_PAYTABLE[4].payoutMultiplier).toBe(10);
    expect(SCATTER_PAYTABLE[4].freeSpins).toBe(15);

    expect(SCATTER_PAYTABLE[5].payoutMultiplier).toBe(50);
    expect(SCATTER_PAYTABLE[5].freeSpins).toBe(20);
  });

  it('should accurately tag isWild and isScatter in symbol metadata', () => {
    expect(SYMBOL_CONFIGS[SymbolId.WILD].isWild).toBe(true);
    expect(SYMBOL_CONFIGS[SymbolId.WILD].isScatter).toBe(false);

    expect(SYMBOL_CONFIGS[SymbolId.SCATTER].isWild).toBe(false);
    expect(SYMBOL_CONFIGS[SymbolId.SCATTER].isScatter).toBe(true);

    expect(SYMBOL_CONFIGS[SymbolId.COIN].isWild).toBe(false);
    expect(SYMBOL_CONFIGS[SymbolId.COIN].isScatter).toBe(false);
  });
});

describe('2. Reel Strips Architecture', () => {
  it('should have 5 reels with length 50 each', () => {
    expect(REEL_STRIPS.length).toBe(5);
    for (let r = 0; r < REEL_COUNT; r++) {
      expect(REEL_STRIPS[r].length).toBe(50);
    }
  });

  it('should NOT place Wild on Reel 1 or Reel 5', () => {
    const reel1Dist = getReelDistribution(0);
    const reel5Dist = getReelDistribution(4);

    expect(reel1Dist[SymbolId.WILD]).toBe(0);
    expect(reel5Dist[SymbolId.WILD]).toBe(0);
  });

  it('should place Wild on middle reels 2, 3, and 4', () => {
    const reel2Dist = getReelDistribution(1);
    const reel3Dist = getReelDistribution(2);
    const reel4Dist = getReelDistribution(3);

    expect(reel2Dist[SymbolId.WILD]).toBeGreaterThan(0);
    expect(reel3Dist[SymbolId.WILD]).toBeGreaterThan(0);
    expect(reel4Dist[SymbolId.WILD]).toBeGreaterThan(0);
  });

  it('should place Scatters on all reels', () => {
    for (let r = 0; r < REEL_COUNT; r++) {
      const dist = getReelDistribution(r);
      expect(dist[SymbolId.SCATTER]).toBeGreaterThan(0);
    }
  });

  it('should build a valid 5x3 grid from stop indices', () => {
    const stops = [0, 5, 10, 15, 20];
    const grid = buildGridFromStops(stops);

    expect(grid.length).toBe(5);
    for (let r = 0; r < 5; r++) {
      expect(grid[r].length).toBe(3);
    }
  });
});

describe('3. 243-Ways Win Evaluation Algorithm', () => {
  it('should correctly evaluate a single 3-of-a-kind win', () => {
    // Grid: ACE on Reel 0, 1, 2. No other symbol appears on 3 consecutive reels.
    const grid: SymbolId[][] = [
      [SymbolId.ACE, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.ACE, SymbolId.JACK, SymbolId.QUEEN],
      [SymbolId.ACE, SymbolId.KING, SymbolId.TORTOISE],
      [SymbolId.SHIP, SymbolId.BIRD, SymbolId.COIN],
      [SymbolId.SHIP, SymbolId.BIRD, SymbolId.COIN],
    ];

    const result = WinEvaluator.evaluate(grid);
    expect(result.winningWays.length).toBe(1);

    const aceWin = result.winningWays[0];
    expect(aceWin.symbolId).toBe(SymbolId.ACE);
    expect(aceWin.matchCount).toBe(3);
    expect(aceWin.wayCount).toBe(1); // 1 x 1 x 1
    expect(aceWin.payoutPerWay).toBe(PAYTABLE[SymbolId.ACE][3]);
    expect(aceWin.totalPayout).toBe(PAYTABLE[SymbolId.ACE][3]);
  });

  it('should correctly calculate multiplicative ways (e.g. 2 x 1 x 3 = 6 ways)', () => {
    // 2 ACEs on Reel 0, 1 ACE on Reel 1, 3 ACEs on Reel 2
    const grid: SymbolId[][] = [
      [SymbolId.ACE, SymbolId.ACE, SymbolId.TEN],        // 2 ACEs
      [SymbolId.ACE, SymbolId.TEN, SymbolId.NINE],       // 1 ACE
      [SymbolId.ACE, SymbolId.ACE, SymbolId.ACE],        // 3 ACEs
      [SymbolId.TEN, SymbolId.NINE, SymbolId.JACK],      // 0 ACE
      [SymbolId.TEN, SymbolId.NINE, SymbolId.JACK],      // 0 ACE
    ];

    const result = WinEvaluator.evaluate(grid);
    const aceWin = result.winningWays.find((w) => w.symbolId === SymbolId.ACE);

    expect(aceWin).toBeDefined();
    expect(aceWin!.matchCount).toBe(3);
    expect(aceWin!.wayCount).toBe(6); // 2 * 1 * 3 = 6 ways!
    expect(aceWin!.totalPayout).toBe(6 * PAYTABLE[SymbolId.ACE][3]);
  });

  it('should correctly substitute WILD on reels 2, 3, 4', () => {
    // COIN on Reel 0, WILD on Reel 1, COIN on Reel 2
    const grid: SymbolId[][] = [
      [SymbolId.COIN, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.WILD, SymbolId.NINE, SymbolId.TEN], // Wild substitutes for COIN
      [SymbolId.COIN, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.NINE, SymbolId.TEN, SymbolId.JACK],
      [SymbolId.NINE, SymbolId.TEN, SymbolId.JACK],
    ];

    const result = WinEvaluator.evaluate(grid);
    const coinWin = result.winningWays.find((w) => w.symbolId === SymbolId.COIN);

    expect(coinWin).toBeDefined();
    expect(coinWin!.matchCount).toBe(3);
    expect(coinWin!.wayCount).toBe(1);
    expect(coinWin!.totalPayout).toBe(PAYTABLE[SymbolId.COIN][3]);
  });

  it('should allow WILD to substitute for multiple symbols simultaneously', () => {
    // Reel 0: COIN and BIRD
    // Reel 1: WILD
    // Reel 2: COIN and BIRD
    const grid: SymbolId[][] = [
      [SymbolId.COIN, SymbolId.BIRD, SymbolId.TEN],
      [SymbolId.WILD, SymbolId.TEN, SymbolId.NINE], // Substitutes for BOTH Coin and Bird!
      [SymbolId.COIN, SymbolId.BIRD, SymbolId.TEN],
      [SymbolId.TEN, SymbolId.NINE, SymbolId.JACK],
      [SymbolId.TEN, SymbolId.NINE, SymbolId.JACK],
    ];

    const result = WinEvaluator.evaluate(grid);
    const coinWin = result.winningWays.find((w) => w.symbolId === SymbolId.COIN);
    const birdWin = result.winningWays.find((w) => w.symbolId === SymbolId.BIRD);

    expect(coinWin).toBeDefined();
    expect(coinWin!.matchCount).toBe(3);

    expect(birdWin).toBeDefined();
    expect(birdWin!.matchCount).toBe(3);
  });

  it('should not award a win if combination does not start on Reel 0', () => {
    // COIN on reels 1, 2, 3 but NOT on reel 0
    const grid: SymbolId[][] = [
      [SymbolId.TEN, SymbolId.NINE, SymbolId.JACK],
      [SymbolId.COIN, SymbolId.NINE, SymbolId.JACK],
      [SymbolId.COIN, SymbolId.NINE, SymbolId.JACK],
      [SymbolId.COIN, SymbolId.NINE, SymbolId.JACK],
      [SymbolId.TEN, SymbolId.NINE, SymbolId.JACK],
    ];

    const result = WinEvaluator.evaluate(grid);
    const coinWin = result.winningWays.find((w) => w.symbolId === SymbolId.COIN);
    expect(coinWin).toBeUndefined();
  });

  it('should not award a win if streak is broken before reel 3', () => {
    // COIN on reel 0 and 1, but missing on reel 2
    const grid: SymbolId[][] = [
      [SymbolId.COIN, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.COIN, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.TEN, SymbolId.NINE, SymbolId.JACK],  // Gap!
      [SymbolId.COIN, SymbolId.NINE, SymbolId.JACK],
      [SymbolId.COIN, SymbolId.NINE, SymbolId.JACK],
    ];

    const result = WinEvaluator.evaluate(grid);
    const coinWin = result.winningWays.find((w) => w.symbolId === SymbolId.COIN);
    expect(coinWin).toBeUndefined();
  });

  it('should not allow WILD to substitute for SCATTER', () => {
    // 2 Scatters and 1 Wild
    const grid: SymbolId[][] = [
      [SymbolId.SCATTER, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.WILD, SymbolId.NINE, SymbolId.TEN], // Wild cannot act as Scatter
      [SymbolId.SCATTER, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.NINE, SymbolId.TEN, SymbolId.JACK],
      [SymbolId.NINE, SymbolId.TEN, SymbolId.JACK],
    ];

    const result = WinEvaluator.evaluate(grid);
    expect(result.scatterCount).toBe(2);
    expect(result.isFreeSpinsTriggered).toBe(false);
    expect(result.scatterWin).toBe(0);
  });

  it('should trigger Free Spins and award payout on 3 or more Scatters', () => {
    // 3 Scatters across grid
    const grid: SymbolId[][] = [
      [SymbolId.SCATTER, SymbolId.NINE, SymbolId.TEN],
      [SymbolId.TEN, SymbolId.SCATTER, SymbolId.NINE],
      [SymbolId.TEN, SymbolId.NINE, SymbolId.SCATTER],
      [SymbolId.NINE, SymbolId.TEN, SymbolId.JACK],
      [SymbolId.NINE, SymbolId.TEN, SymbolId.JACK],
    ];

    const result = WinEvaluator.evaluate(grid, [0, 0, 0, 0, 0], 1);
    expect(result.scatterCount).toBe(3);
    expect(result.isFreeSpinsTriggered).toBe(true);
    expect(result.freeSpinsAwarded).toBe(10);
    expect(result.scatterWin).toBe(BASE_BET * 5); // 5x total bet
  });
});

describe('4. Simulator and RTP Verification', () => {
  it('should simulate 1,000 spins cleanly without error', () => {
    const { stats, durationMs } = SlotSimulator.run(1000, 1, false);

    expect(stats.totalSpins).toBe(1000);
    expect(stats.totalBet).toBe(1000 * BASE_BET);
    expect(stats.hitFrequency).toBeGreaterThan(25);
    expect(stats.hitFrequency).toBeLessThan(50);
    expect(durationMs).toBeGreaterThan(0);
  });
});
