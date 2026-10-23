/**
 * SlotKita 243-Ways Math Engine - Paytable Configuration
 * Oriental Slot Theme (Higgs Domino / 5 Dragons / DuoFuDuoCai style)
 */

import { SymbolId, PaytableMatrix, ScatterPaytable, ISymbolConfig } from './Types';

/**
 * Standard base bet to cover 243 ways.
 * Traditional 243-ways slots require 50 coins to cover all possible combinations.
 */
export const BASE_BET = 50;

/**
 * Payout table for regular combinations (3x, 4x, 5x of a kind).
 * Values represent credit payouts per winning way.
 */
export const PAYTABLE: PaytableMatrix = {
  [SymbolId.NINE]: {
    3: 7,
    4: 16,
    5: 110,
  },
  [SymbolId.TEN]: {
    3: 7,
    4: 16,
    5: 110,
  },
  [SymbolId.JACK]: {
    3: 12,
    4: 30,
    5: 130,
  },
  [SymbolId.QUEEN]: {
    3: 12,
    4: 30,
    5: 130,
  },
  [SymbolId.KING]: {
    3: 15,
    4: 42,
    5: 180,
  },
  [SymbolId.ACE]: {
    3: 15,
    4: 40,
    5: 180,
  },
  [SymbolId.TORTOISE]: {
    3: 32,
    4: 90,
    5: 400,
  },
  [SymbolId.SHIP]: {
    3: 50,
    4: 150,
    5: 620,
  },
  [SymbolId.BIRD]: {
    3: 85,
    4: 240,
    5: 1100,
  },
  [SymbolId.COIN]: {
    3: 150,
    4: 400,
    5: 1650,
  },
  // Wild does not have standalone payout; substitutes for others on reels 2, 3, 4
  [SymbolId.WILD]: {
    3: 0,
    4: 0,
    5: 0,
  },
  // Scatter payouts are evaluated separately based on total bet multiplier
  [SymbolId.SCATTER]: {
    3: 0,
    4: 0,
    5: 0,
  },
};

/**
 * Scatter payout rules:
 * Evaluated whenever 3 or more Scatters land anywhere on the reels.
 * Payout is a multiplier of the total bet + Free Spins awarded.
 */
export const SCATTER_PAYTABLE: ScatterPaytable = {
  3: { payoutMultiplier: 5, freeSpins: 10 },
  4: { payoutMultiplier: 10, freeSpins: 15 },
  5: { payoutMultiplier: 50, freeSpins: 20 },
};

/**
 * Rich symbol metadata for rendering, localization, and rules.
 */
export const SYMBOL_CONFIGS: Record<SymbolId, ISymbolConfig> = {
  [SymbolId.NINE]: {
    id: SymbolId.NINE,
    name: '9',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.NINE],
  },
  [SymbolId.TEN]: {
    id: SymbolId.TEN,
    name: '10',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.TEN],
  },
  [SymbolId.JACK]: {
    id: SymbolId.JACK,
    name: 'J',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.JACK],
  },
  [SymbolId.QUEEN]: {
    id: SymbolId.QUEEN,
    name: 'Q',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.QUEEN],
  },
  [SymbolId.KING]: {
    id: SymbolId.KING,
    name: 'K',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.KING],
  },
  [SymbolId.ACE]: {
    id: SymbolId.ACE,
    name: 'A',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.ACE],
  },
  [SymbolId.TORTOISE]: {
    id: SymbolId.TORTOISE,
    name: 'Kura-kura Emas',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.TORTOISE],
  },
  [SymbolId.SHIP]: {
    id: SymbolId.SHIP,
    name: 'Kapal Layar Emas',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.SHIP],
  },
  [SymbolId.BIRD]: {
    id: SymbolId.BIRD,
    name: 'Burung Phoenix Emas',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.BIRD],
  },
  [SymbolId.COIN]: {
    id: SymbolId.COIN,
    name: 'Koin Emas Keberuntungan',
    isWild: false,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.COIN],
  },
  [SymbolId.WILD]: {
    id: SymbolId.WILD,
    name: 'Giok Naga Wild',
    isWild: true,
    isScatter: false,
    payouts: PAYTABLE[SymbolId.WILD],
  },
  [SymbolId.SCATTER]: {
    id: SymbolId.SCATTER,
    name: 'Gong Emas Scatter',
    isWild: false,
    isScatter: true,
    payouts: PAYTABLE[SymbolId.SCATTER],
  },
};
