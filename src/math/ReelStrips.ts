/**
 * SlotKita 243-Ways Math Engine - Reel Strips Configuration
 * 5 Virtual Reel Strips (50 symbols each) with calibrated probability distribution.
 * Theme: Oriental Fortune (Higgs Domino / DuoFuDuoCai style).
 */

import { SymbolId } from './Types';

/**
 * Reel 1 (Index 0) - Length: 50
 * No Wild symbols on Reel 1 (must start combination with natural symbol).
 */
export const REEL_1: SymbolId[] = [
  SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.QUEEN, SymbolId.KING,
  SymbolId.ACE, SymbolId.TORTOISE, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK,
  SymbolId.SCATTER, SymbolId.QUEEN, SymbolId.KING, SymbolId.SHIP, SymbolId.NINE,
  SymbolId.TEN, SymbolId.JACK, SymbolId.BIRD, SymbolId.QUEEN, SymbolId.KING,
  SymbolId.ACE, SymbolId.COIN, SymbolId.TORTOISE, SymbolId.NINE, SymbolId.TEN,
  SymbolId.JACK, SymbolId.QUEEN, SymbolId.KING, SymbolId.ACE, SymbolId.SHIP,
  SymbolId.SCATTER, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.TORTOISE,
  SymbolId.QUEEN, SymbolId.KING, SymbolId.BIRD, SymbolId.ACE, SymbolId.COIN,
  SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.QUEEN, SymbolId.KING,
  SymbolId.ACE, SymbolId.TORTOISE, SymbolId.SHIP, SymbolId.BIRD, SymbolId.TEN,
];

/**
 * Reel 2 (Index 1) - Length: 50
 * Wild appears on Reel 2 (substitutes all except Scatter).
 */
export const REEL_2: SymbolId[] = [
  SymbolId.TEN, SymbolId.JACK, SymbolId.WILD, SymbolId.QUEEN, SymbolId.KING,
  SymbolId.ACE, SymbolId.NINE, SymbolId.TORTOISE, SymbolId.TEN, SymbolId.JACK,
  SymbolId.SCATTER, SymbolId.QUEEN, SymbolId.SHIP, SymbolId.KING, SymbolId.ACE,
  SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.WILD, SymbolId.QUEEN,
  SymbolId.BIRD, SymbolId.KING, SymbolId.ACE, SymbolId.COIN, SymbolId.NINE,
  SymbolId.TEN, SymbolId.JACK, SymbolId.TORTOISE, SymbolId.QUEEN, SymbolId.KING,
  SymbolId.SCATTER, SymbolId.ACE, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK,
  SymbolId.WILD, SymbolId.QUEEN, SymbolId.SHIP, SymbolId.KING, SymbolId.BIRD,
  SymbolId.ACE, SymbolId.COIN, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK,
  SymbolId.TORTOISE, SymbolId.QUEEN, SymbolId.KING, SymbolId.TORTOISE, SymbolId.SHIP,
];

/**
 * Reel 3 (Index 2) - Length: 50
 * Wild appears on Reel 3.
 */
export const REEL_3: SymbolId[] = [
  SymbolId.JACK, SymbolId.QUEEN, SymbolId.WILD, SymbolId.KING, SymbolId.ACE,
  SymbolId.NINE, SymbolId.TEN, SymbolId.TORTOISE, SymbolId.JACK, SymbolId.QUEEN,
  SymbolId.SCATTER, SymbolId.KING, SymbolId.ACE, SymbolId.SHIP, SymbolId.NINE,
  SymbolId.TEN, SymbolId.JACK, SymbolId.WILD, SymbolId.QUEEN, SymbolId.KING,
  SymbolId.BIRD, SymbolId.ACE, SymbolId.COIN, SymbolId.NINE, SymbolId.TEN,
  SymbolId.JACK, SymbolId.QUEEN, SymbolId.TORTOISE, SymbolId.KING, SymbolId.ACE,
  SymbolId.SCATTER, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.WILD,
  SymbolId.QUEEN, SymbolId.SHIP, SymbolId.KING, SymbolId.BIRD, SymbolId.ACE,
  SymbolId.COIN, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.TORTOISE,
  SymbolId.QUEEN, SymbolId.KING, SymbolId.TORTOISE, SymbolId.SHIP, SymbolId.QUEEN,
];

/**
 * Reel 4 (Index 3) - Length: 50
 * Wild appears on Reel 4.
 */
export const REEL_4: SymbolId[] = [
  SymbolId.QUEEN, SymbolId.KING, SymbolId.WILD, SymbolId.ACE, SymbolId.NINE,
  SymbolId.TEN, SymbolId.JACK, SymbolId.TORTOISE, SymbolId.QUEEN, SymbolId.KING,
  SymbolId.SCATTER, SymbolId.ACE, SymbolId.SHIP, SymbolId.NINE, SymbolId.TEN,
  SymbolId.JACK, SymbolId.QUEEN, SymbolId.WILD, SymbolId.KING, SymbolId.BIRD,
  SymbolId.ACE, SymbolId.COIN, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK,
  SymbolId.QUEEN, SymbolId.TORTOISE, SymbolId.KING, SymbolId.ACE, SymbolId.SHIP,
  SymbolId.SCATTER, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.WILD,
  SymbolId.QUEEN, SymbolId.KING, SymbolId.BIRD, SymbolId.ACE, SymbolId.COIN,
  SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.TORTOISE, SymbolId.QUEEN,
  SymbolId.KING, SymbolId.BIRD, SymbolId.TORTOISE, SymbolId.SHIP, SymbolId.ACE,
];

/**
 * Reel 5 (Index 4) - Length: 50
 * No Wild symbols on Reel 5 (Standard Aristocrat/Higgs Domino format).
 */
export const REEL_5: SymbolId[] = [
  SymbolId.KING, SymbolId.ACE, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK,
  SymbolId.QUEEN, SymbolId.TORTOISE, SymbolId.KING, SymbolId.ACE, SymbolId.SHIP,
  SymbolId.SCATTER, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.QUEEN,
  SymbolId.KING, SymbolId.BIRD, SymbolId.ACE, SymbolId.COIN, SymbolId.NINE,
  SymbolId.TEN, SymbolId.JACK, SymbolId.QUEEN, SymbolId.TORTOISE, SymbolId.KING,
  SymbolId.ACE, SymbolId.SCATTER, SymbolId.SHIP, SymbolId.NINE, SymbolId.TEN,
  SymbolId.JACK, SymbolId.QUEEN, SymbolId.KING, SymbolId.BIRD, SymbolId.ACE,
  SymbolId.COIN, SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.TORTOISE,
  SymbolId.QUEEN, SymbolId.KING, SymbolId.ACE, SymbolId.TORTOISE, SymbolId.SHIP,
  SymbolId.NINE, SymbolId.TEN, SymbolId.JACK, SymbolId.QUEEN, SymbolId.TEN,
];

/**
 * Master array containing all 5 reel strips.
 */
export const REEL_STRIPS: readonly SymbolId[][] = [
  REEL_1,
  REEL_2,
  REEL_3,
  REEL_4,
  REEL_5,
];

/**
 * Visible rows in the window (3 rows per reel = 5x3 grid).
 */
export const VISIBLE_ROWS = 3;

/**
 * Total number of reels.
 */
export const REEL_COUNT = 5;

/**
 * Generates random stop indices for each reel.
 */
export function getRandomStops(): number[] {
  return REEL_STRIPS.map((strip) => Math.floor(Math.random() * strip.length));
}

/**
 * Constructs a 5x3 visible grid given 5 stop positions.
 * grid[reelIndex][rowIndex] where rowIndex 0 is top, 1 is center, 2 is bottom.
 */
export function buildGridFromStops(stops: number[]): SymbolId[][] {
  if (stops.length !== REEL_COUNT) {
    throw new Error(`Invalid stops length: expected ${REEL_COUNT}, got ${stops.length}`);
  }

  const grid: SymbolId[][] = [];

  for (let reelIdx = 0; reelIdx < REEL_COUNT; reelIdx++) {
    const strip = REEL_STRIPS[reelIdx];
    const stripLen = strip.length;
    const stop = stops[reelIdx];
    const reelSymbols: SymbolId[] = [];

    for (let row = 0; row < VISIBLE_ROWS; row++) {
      const symbolIndex = (stop + row) % stripLen;
      reelSymbols.push(strip[symbolIndex]);
    }

    grid.push(reelSymbols);
  }

  return grid;
}

/**
 * Convenience function to generate random stops and build the corresponding 5x3 grid.
 */
export function generateRandomGrid(): { grid: SymbolId[][]; stops: number[] } {
  const stops = getRandomStops();
  const grid = buildGridFromStops(stops);
  return { grid, stops };
}

/**
 * Low-pay royal symbols removed during Free Spins feature.
 */
export const LOW_PAY_ROYALS = new Set<SymbolId>([
  SymbolId.NINE,
  SymbolId.TEN,
  SymbolId.JACK,
  SymbolId.QUEEN,
  SymbolId.KING,
  SymbolId.ACE,
]);

/**
 * Enriched Free Spin Reel Strips:
 * All low-pay card ranks (9, 10, J, Q, K, A) are completely removed.
 * Only High-Pay symbols (Tortoise, Ship, Bird, Coin), Wilds, and Scatters remain!
 */
export const FREE_SPIN_REEL_STRIPS: readonly SymbolId[][] = REEL_STRIPS.map((strip) =>
  strip.filter((sym) => !LOW_PAY_ROYALS.has(sym))
);

export function getRandomFreeSpinStops(): number[] {
  return FREE_SPIN_REEL_STRIPS.map((strip) => Math.floor(Math.random() * strip.length));
}

export function buildFreeSpinGridFromStops(stops: number[]): SymbolId[][] {
  const grid: SymbolId[][] = [];

  for (let reelIdx = 0; reelIdx < REEL_COUNT; reelIdx++) {
    const strip = FREE_SPIN_REEL_STRIPS[reelIdx];
    const stripLen = strip.length;
    const stop = stops[reelIdx];
    const reelSymbols: SymbolId[] = [];

    for (let row = 0; row < VISIBLE_ROWS; row++) {
      const symbolIndex = (stop + row) % stripLen;
      reelSymbols.push(strip[symbolIndex]);
    }

    grid.push(reelSymbols);
  }

  return grid;
}

export function generateFreeSpinRandomGrid(): { grid: SymbolId[][]; stops: number[] } {
  const stops = getRandomFreeSpinStops();
  const grid = buildFreeSpinGridFromStops(stops);
  return { grid, stops };
}

/**
 * Calculates the exact symbol frequency distribution for a given reel strip.
 */
export function getReelDistribution(reelIndex: number): Record<SymbolId, number> {
  const strip = REEL_STRIPS[reelIndex];
  const dist = {} as Record<SymbolId, number>;

  for (const s of Object.values(SymbolId)) {
    dist[s] = 0;
  }

  for (const symbol of strip) {
    dist[symbol] = (dist[symbol] || 0) + 1;
  }

  return dist;
}
