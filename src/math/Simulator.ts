/**
 * SlotKita 243-Ways Math Engine - Monte Carlo Simulator
 * Phase 1: Pure Headless Math Engine
 *
 * Runs N spins (default 10,000) to verify:
 * - Total RTP (Target: 94.00% - 97.00%)
 * - Hit Frequency (25% - 35%)
 * - Free Spins Feature Trigger Frequency
 * - Payout distribution and symbol contribution breakdown
 */

import { SymbolId, SimulationStats } from './Types';
import { BASE_BET } from './Paytable';
import { WinEvaluator } from './WinEvaluator';
import { generateRandomGrid } from './ReelStrips';

export interface SymbolStat {
  symbolId: SymbolId;
  hits: number;
  totalWon: number;
  maxPayout: number;
}

export class SlotSimulator {
  /**
   * Runs Monte Carlo simulation of base game + free spins.
   *
   * @param totalSpins Total number of base game spins to simulate (default 10,000)
   * @param betMultiplier Bet multiplier (default 1, bet = 50 coins)
   * @param playFreeSpins Whether to automatically play out triggered free spins
   * @returns Comprehensive SimulationStats
   */
  public static run(
    totalSpins: number = 10000,
    betMultiplier: number = 1,
    playFreeSpins: boolean = true
  ): {
    stats: SimulationStats;
    symbolStats: Record<SymbolId, SymbolStat>;
    durationMs: number;
  } {
    const startTime = performance.now();
    const spinBet = BASE_BET * betMultiplier;
    const totalBet = spinBet * totalSpins;

    let baseGameWon = 0;
    let freeSpinsWon = 0;
    let hitCount = 0;
    let freeSpinsTriggers = 0;
    let maxWin = 0;
    let maxMultiplier = 0;

    // Track statistics for each symbol
    const symbolStats: Record<SymbolId, SymbolStat> = {} as any;
    for (const sym of Object.values(SymbolId)) {
      symbolStats[sym] = {
        symbolId: sym,
        hits: 0,
        totalWon: 0,
        maxPayout: 0,
      };
    }

    for (let i = 0; i < totalSpins; i++) {
      const { grid, stops } = generateRandomGrid();
      const result = WinEvaluator.evaluate(grid, stops, betMultiplier);

      const baseWin = result.totalWin;
      baseGameWon += baseWin;

      if (baseWin > 0) {
        hitCount++;
      }

      // Record symbol hits
      for (const way of result.winningWays) {
        const stat = symbolStats[way.symbolId];
        stat.hits++;
        stat.totalWon += way.totalPayout;
        if (way.totalPayout > stat.maxPayout) {
          stat.maxPayout = way.totalPayout;
        }
      }

      if (result.scatterWin > 0) {
        const scatterStat = symbolStats[SymbolId.SCATTER];
        scatterStat.hits++;
        scatterStat.totalWon += result.scatterWin;
        if (result.scatterWin > scatterStat.maxPayout) {
          scatterStat.maxPayout = result.scatterWin;
        }
      }

      // Handle Free Spins feature if triggered
      let currentSpinTotalWin = baseWin;
      if (result.isFreeSpinsTriggered) {
        freeSpinsTriggers++;

        if (playFreeSpins) {
          let remainingFreeSpins = result.freeSpinsAwarded;
          while (remainingFreeSpins > 0) {
            remainingFreeSpins--;
            const fsGrid = generateRandomGrid();
            const fsResult = WinEvaluator.evaluate(
              fsGrid.grid,
              fsGrid.stops,
              betMultiplier
            );

            freeSpinsWon += fsResult.totalWin;
            currentSpinTotalWin += fsResult.totalWin;

            // Retrigger during Free Spins
            if (fsResult.isFreeSpinsTriggered) {
              remainingFreeSpins += fsResult.freeSpinsAwarded;
            }

            // Track symbol wins in free spins
            for (const way of fsResult.winningWays) {
              const stat = symbolStats[way.symbolId];
              stat.hits++;
              stat.totalWon += way.totalPayout;
              if (way.totalPayout > stat.maxPayout) {
                stat.maxPayout = way.totalPayout;
              }
            }
            if (fsResult.scatterWin > 0) {
              const scatterStat = symbolStats[SymbolId.SCATTER];
              scatterStat.hits++;
              scatterStat.totalWon += fsResult.scatterWin;
            }
          }
        }
      }

      if (currentSpinTotalWin > maxWin) {
        maxWin = currentSpinTotalWin;
        maxMultiplier = currentSpinTotalWin / spinBet;
      }
    }

    const totalWon = baseGameWon + freeSpinsWon;
    const durationMs = performance.now() - startTime;

    const stats: SimulationStats = {
      totalSpins,
      totalBet,
      totalWon,
      baseGameWon,
      freeSpinsWon,
      overallRTP: (totalWon / totalBet) * 100,
      baseGameRTP: (baseGameWon / totalBet) * 100,
      freeSpinsRTP: (freeSpinsWon / totalBet) * 100,
      hitCount,
      hitFrequency: (hitCount / totalSpins) * 100,
      freeSpinsTriggers,
      freeSpinsTriggerRate: (freeSpinsTriggers / totalSpins) * 100,
      maxWin,
      maxMultiplier,
    };

    return { stats, symbolStats, durationMs };
  }

  /**
   * Formats and prints a simulation report to console.
   */
  public static printReport(
    stats: SimulationStats,
    symbolStats: Record<SymbolId, SymbolStat>,
    durationMs: number
  ): void {
    const divider = '━'.repeat(64);
    const thinDivider = '─'.repeat(64);

    console.log('\n' + divider);
    console.log('       🎰  SLOTKITA - 243-WAYS MATH ENGINE SIMULATOR  🎰');
    console.log('       Tema Oriental ala Higgs Domino (5x3 Reel Matrix)');
    console.log(divider);
    console.log(`⏱  Waktu Eksekusi   : ${durationMs.toFixed(2)} ms (${(durationMs / 1000).toFixed(2)} detik)`);
    console.log(`🎲 Total Putaran    : ${stats.totalSpins.toLocaleString()} spin`);
    console.log(`💰 Total Taruhan    : ${stats.totalBet.toLocaleString()} koin`);
    console.log(`🎁 Total Kemenangan : ${stats.totalWon.toLocaleString()} koin`);
    console.log(thinDivider);

    const rtpColor =
      stats.overallRTP >= 94.0 && stats.overallRTP <= 97.0
        ? '\x1b[32m' // Green
        : '\x1b[33m'; // Yellow
    const resetColor = '\x1b[0m';

    console.log(
      `📊 TOTAL RTP        : ${rtpColor}${stats.overallRTP.toFixed(2)}%${resetColor} (Target Resmi: 94.00% - 97.00%)`
    );
    console.log(`   ├─ Base Game RTP : ${stats.baseGameRTP.toFixed(2)}%`);
    console.log(`   └─ Free Spin RTP : ${stats.freeSpinsRTP.toFixed(2)}%`);
    console.log(thinDivider);
    console.log(
      `🎯 Hit Frequency    : ${stats.hitFrequency.toFixed(2)}% (${stats.hitCount.toLocaleString()} kemenangan)`
    );
    const triggerInterval =
      stats.freeSpinsTriggers > 0
        ? Math.round(stats.totalSpins / stats.freeSpinsTriggers)
        : 0;
    console.log(
      `🔥 Free Spin Trigger: ${stats.freeSpinsTriggerRate.toFixed(2)}% (1 per ~${triggerInterval} spin, Total: ${stats.freeSpinsTriggers})`
    );
    console.log(
      `🏆 Kemenangan Maks  : ${stats.maxWin.toLocaleString()} koin (${stats.maxMultiplier.toFixed(1)}x bet)`
    );

    console.log(thinDivider);
    console.log('📋 KONTRIBUSI SIMBOL & FREKUENSI KEMENANGAN:');
    console.log(
      ' Simbol       │ Hit Count │ Total Menang │ Kontribusi RTP'
    );
    console.log(
      '──────────────┼───────────┼──────────────┼───────────────'
    );

    for (const [sym, stat] of Object.entries(symbolStats)) {
      const contrib = ((stat.totalWon / stats.totalBet) * 100).toFixed(2);
      const name = sym.padEnd(12, ' ');
      const hits = stat.hits.toLocaleString().padStart(9, ' ');
      const won = stat.totalWon.toLocaleString().padStart(12, ' ');
      console.log(` ${name} │ ${hits} │ ${won} │ ${contrib.padStart(11, ' ')}%`);
    }

    console.log(divider);

    if (stats.overallRTP >= 94.0 && stats.overallRTP <= 97.0) {
      console.log('✅ VERIFIKASI MATEMATIKA: SUKSES (RTP Berada di Rentang 94% - 97%)\n');
    } else {
      console.log('⚠️ PERINGATAN: RTP berada di luar rentang ideal 94% - 97%\n');
    }
  }
}

// Allow direct execution from CLI via tsx or node
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith('Simulator.ts') ||
    process.argv[1].endsWith('Simulator.js'));

if (isMainModule) {
  const spins = process.argv[2] ? parseInt(process.argv[2], 10) : 10000;
  console.log(`Memulai simulasi ${spins.toLocaleString()} spin...`);
  const { stats, symbolStats, durationMs } = SlotSimulator.run(spins);
  SlotSimulator.printReport(stats, symbolStats, durationMs);
}
