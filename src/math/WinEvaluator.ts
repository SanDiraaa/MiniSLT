/**
 * SlotKita 243-Ways Math Engine - Win Evaluator
 * High-performance 243 Ways to Win evaluation with Wild substitution and Scatter bonus detection.
 */

import {
  SymbolId,
  WinWay,
  SpinResult,
  GridPosition,
} from './Types';
import {
  PAYTABLE,
  SCATTER_PAYTABLE,
  SYMBOL_CONFIGS,
  BASE_BET,
} from './Paytable';
import {
  REEL_COUNT,
  VISIBLE_ROWS,
  generateRandomGrid,
} from './ReelStrips';

/**
 * List of regular paying symbols that participate in 243-ways evaluation.
 * Excludes WILD (substitute only) and SCATTER (evaluated independently).
 */
export const PAYING_SYMBOLS: SymbolId[] = [
  SymbolId.COIN,
  SymbolId.BIRD,
  SymbolId.SHIP,
  SymbolId.TORTOISE,
  SymbolId.ACE,
  SymbolId.KING,
  SymbolId.QUEEN,
  SymbolId.JACK,
  SymbolId.TEN,
  SymbolId.NINE,
];

export class WinEvaluator {
  /**
   * Evaluates a 5x3 grid according to 243-ways rules.
   *
   * @param grid 5x3 array [reelIndex][rowIndex]
   * @param stopIndices Optional array of reel stop indices
   * @param betMultiplier Bet multiplier (default 1, meaning total bet = BASE_BET * 1 = 50)
   * @returns Complete SpinResult
   */
  public static evaluate(
    grid: SymbolId[][],
    stopIndices: number[] = [0, 0, 0, 0, 0],
    betMultiplier: number = 1
  ): SpinResult {
    this.validateGrid(grid);

    const totalBet = BASE_BET * betMultiplier;
    const winningWays: WinWay[] = [];
    let waysWin = 0;

    // 1. Evaluate 243-ways for each regular paying symbol
    for (const symbol of PAYING_SYMBOLS) {
      const wayWin = this.evaluateSymbolWays(grid, symbol, betMultiplier);
      if (wayWin) {
        winningWays.push(wayWin);
        waysWin += wayWin.totalPayout;
      }
    }

    // 2. Evaluate Scatter symbols across all positions
    const { scatterCount, scatterWin, isFreeSpinsTriggered, freeSpinsAwarded } =
      this.evaluateScatters(grid, totalBet);

    const totalWin = waysWin + scatterWin;
    const payoutMultiplier = totalBet > 0 ? totalWin / totalBet : 0;

    return {
      grid,
      stopIndices,
      winningWays,
      waysWin,
      scatterCount,
      scatterWin,
      totalWin,
      isFreeSpinsTriggered,
      freeSpinsAwarded,
      bet: totalBet,
      payoutMultiplier,
    };
  }

  /**
   * Generates a random spin and evaluates it immediately.
   */
  public static spin(betMultiplier: number = 1): SpinResult {
    const { grid, stops } = generateRandomGrid();
    return this.evaluate(grid, stops, betMultiplier);
  }

  /**
   * Evaluates ways to win for a specific symbol.
   * Combination must begin on Reel 0 and proceed consecutively to Reel 1, 2, 3, 4.
   * WILD substitutes for the symbol on Reels 1, 2, 3 (and any reel where Wild is valid).
   */
  private static evaluateSymbolWays(
    grid: SymbolId[][],
    targetSymbol: SymbolId,
    betMultiplier: number
  ): WinWay | null {
    // Array to store rows where symbol or wild appears for each reel
    const matchRowsPerReel: number[][] = [];

    // Reel 0: Must contain the target symbol itself (WILD does not appear on Reel 0)
    const reel0Rows: number[] = [];
    for (let row = 0; row < VISIBLE_ROWS; row++) {
      if (grid[0][row] === targetSymbol) {
        reel0Rows.push(row);
      }
    }

    if (reel0Rows.length === 0) {
      return null;
    }
    matchRowsPerReel.push(reel0Rows);

    // Reels 1 through 4: Check for target symbol OR WILD
    let matchCount = 1;
    for (let reel = 1; reel < REEL_COUNT; reel++) {
      const rows: number[] = [];
      for (let row = 0; row < VISIBLE_ROWS; row++) {
        const sym = grid[reel][row];
        if (sym === targetSymbol || sym === SymbolId.WILD) {
          rows.push(row);
        }
      }

      if (rows.length === 0) {
        // Streak broken
        break;
      }

      matchRowsPerReel.push(rows);
      matchCount++;
    }

    // Minimum 3 matching consecutive reels required for a win
    if (matchCount < 3) {
      return null;
    }

    // Calculate number of ways: product of symbol counts on each consecutive reel
    let wayCount = 1;
    const winningPositions: GridPosition[] = [];

    for (let reel = 0; reel < matchCount; reel++) {
      const rows = matchRowsPerReel[reel];
      wayCount *= rows.length;
      for (const row of rows) {
        winningPositions.push({ reel, row });
      }
    }

    // Payout lookup
    const payTableEntry = PAYTABLE[targetSymbol];
    const payoutPerWay = payTableEntry[matchCount as 3 | 4 | 5] || 0;
    const totalPayout = wayCount * payoutPerWay * betMultiplier;

    if (totalPayout === 0) {
      return null;
    }

    const config = SYMBOL_CONFIGS[targetSymbol];

    return {
      symbolId: targetSymbol,
      symbolName: config.name,
      matchCount,
      wayCount,
      payoutPerWay,
      totalPayout,
      winningPositions,
    };
  }

  /**
   * Evaluates Scatter occurrences across all 15 grid positions.
   * 3 or more Scatters award payout multiplier * total bet and trigger Free Spins.
   */
  private static evaluateScatters(
    grid: SymbolId[][],
    totalBet: number
  ): {
    scatterCount: number;
    scatterWin: number;
    isFreeSpinsTriggered: boolean;
    freeSpinsAwarded: number;
  } {
    let scatterCount = 0;

    for (let reel = 0; reel < REEL_COUNT; reel++) {
      for (let row = 0; row < VISIBLE_ROWS; row++) {
        if (grid[reel][row] === SymbolId.SCATTER) {
          scatterCount++;
        }
      }
    }

    if (scatterCount >= 3) {
      const clampedCount = Math.min(scatterCount, 5) as 3 | 4 | 5;
      const rule = SCATTER_PAYTABLE[clampedCount];
      const scatterWin = totalBet * rule.payoutMultiplier;
      return {
        scatterCount,
        scatterWin,
        isFreeSpinsTriggered: true,
        freeSpinsAwarded: rule.freeSpins,
      };
    }

    return {
      scatterCount,
      scatterWin: 0,
      isFreeSpinsTriggered: false,
      freeSpinsAwarded: 0,
    };
  }

  /**
   * Validates grid dimensions.
   */
  private static validateGrid(grid: SymbolId[][]): void {
    if (!grid || grid.length !== REEL_COUNT) {
      throw new Error(
        `Invalid grid: expected ${REEL_COUNT} reels, got ${grid?.length}`
      );
    }
    for (let i = 0; i < REEL_COUNT; i++) {
      if (!grid[i] || grid[i].length !== VISIBLE_ROWS) {
        throw new Error(
          `Invalid reel ${i}: expected ${VISIBLE_ROWS} rows, got ${grid[i]?.length}`
        );
      }
    }
  }
}
