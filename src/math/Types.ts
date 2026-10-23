/**
 * SlotKita 243-Ways Math Engine - Type Definitions
 * Phase 1: Pure Headless Math Engine
 */

export enum SymbolId {
  NINE = 'NINE',
  TEN = 'TEN',
  JACK = 'JACK',
  QUEEN = 'QUEEN',
  KING = 'KING',
  ACE = 'ACE',
  TORTOISE = 'TORTOISE', // Kura-kura Emas
  SHIP = 'SHIP',         // Kapal Emas / Jung
  BIRD = 'BIRD',         // Burung Emas / Phoenix
  COIN = 'COIN',         // Koin / Yuanbao Emas (Top Tier)
  WILD = 'WILD',         // Giok Hijau / Wild (Substitutes all except Scatter)
  SCATTER = 'SCATTER',   // Gong Emas / Scatter (Triggers Free Spins)
}

/**
 * Paytable configuration for each symbol count (3x, 4x, 5x).
 */
export interface PaytableEntry {
  3: number;
  4: number;
  5: number;
}

/**
 * Paytable matrix mapping every SymbolId to its payout structure.
 */
export type PaytableMatrix = Record<SymbolId, PaytableEntry>;

/**
 * Scatter paytable configuration based on scatter count (3x, 4x, 5x multiplier of total bet).
 */
export interface ScatterPaytable {
  3: { payoutMultiplier: number; freeSpins: number };
  4: { payoutMultiplier: number; freeSpins: number };
  5: { payoutMultiplier: number; freeSpins: number };
}

/**
 * Configuration metadata for each symbol.
 */
export interface ISymbolConfig {
  id: SymbolId;
  name: string;
  isWild: boolean;
  isScatter: boolean;
  payouts: PaytableEntry;
}

/**
 * Coordinate position of a symbol in the 5x3 slot grid.
 */
export interface GridPosition {
  reel: number; // 0 to 4
  row: number;  // 0 to 2
}

/**
 * Details of an individual winning way in 243-ways evaluation.
 */
export interface WinWay {
  symbolId: SymbolId;
  symbolName: string;
  matchCount: number;         // 3, 4, or 5 consecutive reels from left
  wayCount: number;           // Number of winning paths (e.g., 2 x 1 x 3 = 6 ways)
  payoutPerWay: number;       // Base payout value for this symbol & match count
  totalPayout: number;        // wayCount * payoutPerWay * betMultiplier
  winningPositions: GridPosition[]; // Reel and row coordinates participating in the win
}

/**
 * Complete result of a single spin evaluation.
 */
export interface SpinResult {
  grid: SymbolId[][];           // [reelIndex][rowIndex] 5 reels x 3 visible rows
  stopIndices: number[];        // Random stop index for each reel
  winningWays: WinWay[];        // List of all winning ways
  waysWin: number;              // Total payout from 243 ways
  scatterCount: number;         // Total scatter symbols present on the grid
  scatterWin: number;           // Total payout from scatter symbols
  totalWin: number;             // waysWin + scatterWin
  isFreeSpinsTriggered: boolean;// True if 3 or more scatters landed
  freeSpinsAwarded: number;     // Number of free spins awarded (e.g. 10)
  bet: number;                  // Total bet for this spin
  payoutMultiplier: number;     // totalWin / bet
}

/**
 * Statistical summary of a simulation run.
 */
export interface SimulationStats {
  totalSpins: number;
  totalBet: number;
  totalWon: number;
  baseGameWon: number;
  freeSpinsWon: number;
  overallRTP: number;           // (totalWon / totalBet) * 100%
  baseGameRTP: number;          // (baseGameWon / totalBet) * 100%
  freeSpinsRTP: number;         // (freeSpinsWon / totalBet) * 100%
  hitCount: number;             // Spins with payout > 0
  hitFrequency: number;         // (hitCount / totalSpins) * 100%
  freeSpinsTriggers: number;    // Number of times free spins were triggered
  freeSpinsTriggerRate: number; // (freeSpinsTriggers / totalSpins) * 100%
  maxWin: number;               // Highest payout in a single spin
  maxMultiplier: number;        // Highest payout multiplier
}
