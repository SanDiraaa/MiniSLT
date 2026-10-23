/**
 * SlotKita - Oriental 243-Ways Arcade Slot Game
 * Phase 5: Master Integration (PixiJS v8, Fu Pot, 12-Coin Jackpot, Enriched Free Spins, HUD, Controls, SoundSystem & WinBanner)
 */

import './style.css';
import { SlotState, StateMachine } from './core/FSM';
import { GameStateStore } from './core/GameState';
import { SessionPersistence } from './core/Persistence';
import { WinEvaluator } from './math/WinEvaluator';
import { BASE_BET } from './math/Paytable';
import { SlotView } from './game/SlotView';
import { generateRandomGrid } from './math/ReelStrips';
import { SpinResult, WinWay } from './math/Types';
import { SoundSystem } from './core/SoundSystem';
import { HUD } from './ui/HUD';
import { Controls } from './ui/Controls';
import { WinBanner } from './ui/WinBanner';

// 1. Initialize State Machine, Game State Store & Sound Engine
const fsm = new StateMachine(SlotState.IDLE);
const stateStore = new GameStateStore();
const soundSystem = new SoundSystem();

// 2. Perform Session Recovery
const recovery = SessionPersistence.recoverSession();
if (recovery.isRecovered) {
  stateStore.restoreState(recovery.recoveredData);
  if (recovery.wasInFreeSpins && stateStore.getState().freeSpinsLeft > 0) {
    fsm.forceState(SlotState.FREE_SPINS);
  } else {
    fsm.forceState(SlotState.IDLE);
  }
} else {
  fsm.forceState(SlotState.IDLE);
}

// 3. Bind Auto-Persistence on state/store changes
SessionPersistence.setupAutoPersistence(stateStore, fsm);

// 4. Initialize SlotView Orchestrator
const slotView = new SlotView();

// 5. Build Master DOM Layout
const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col gap-2 sm:gap-3">
    <!-- Progressive Jackpot Header Mount -->
    <div id="hudMount"></div>

    <!-- Recovery Notice Banner (if Free Spins recovered) -->
    <div id="recoveryBanner" class="${recovery.wasInFreeSpins ? '' : 'hidden'} p-2.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-amber-950/90 border border-rose-500/50 text-amber-200 text-xs flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-2">
        <span class="text-base">🔥</span>
        <span><strong>PEMULIHAN SESI BERHASIL:</strong> ${recovery.message}</span>
      </div>
      <button id="dismissBannerBtn" class="text-slate-400 hover:text-white px-2 py-0.5 text-xs">✕</button>
    </div>

    <!-- Central Game Section: WebGL PixiJS Canvas -->
    <section class="oriental-card p-2 sm:p-4 rounded-2xl border-2 border-amber-500/40 shadow-2xl relative flex flex-col items-center overflow-hidden">
      <div class="w-full flex items-center justify-between mb-1 px-1">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span class="text-[10px] sm:text-xs font-bold text-amber-300 tracking-wide uppercase">
            WebGL 60 FPS Canvas (PixiJS v8)
          </span>
        </div>
        <div id="fpsCounter" class="text-[10px] sm:text-xs font-mono text-emerald-400 font-bold">60 FPS</div>
      </div>

      <!-- Canvas Mount Target -->
      <div id="canvasMount" class="relative w-full flex justify-center py-0.5 overflow-hidden">
        <!-- Pixi.js Canvas will be appended here -->
      </div>

      <!-- Live Spin Outcome Banner -->
      <div id="spinSummary" class="w-full mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs">
        <span class="text-slate-400">Tekan tombol <strong>PUTAR</strong> untuk memulai perputaran reel 243-ways.</span>
      </div>
    </section>

    <!-- Player Wallet & Control Console Mount -->
    <div id="controlsMount"></div>

    <!-- Win Celebration Banner Mount -->
    <div id="winBannerMount"></div>
  </main>
`;

// DOM Selectors
const hudMount = document.querySelector<HTMLDivElement>('#hudMount')!;
const canvasMount = document.querySelector<HTMLDivElement>('#canvasMount')!;
const controlsMount = document.querySelector<HTMLDivElement>('#controlsMount')!;
const winBannerMount = document.querySelector<HTMLDivElement>('#winBannerMount')!;
const spinSummary = document.querySelector<HTMLDivElement>('#spinSummary')!;
const fpsCounter = document.querySelector<HTMLDivElement>('#fpsCounter')!;
const recoveryBanner = document.querySelector<HTMLDivElement>('#recoveryBanner')!;
const dismissBannerBtn = document.querySelector<HTMLButtonElement>('#dismissBannerBtn')!;

// 6. Instantiate Modular UI Subsystems
const hud = new HUD(hudMount, stateStore, fsm);
const winBanner = new WinBanner(winBannerMount, soundSystem, slotView.particleManager);

const controls = new Controls(
  controlsMount,
  stateStore,
  fsm,
  soundSystem,
  () => executeSpinCycle()
);

let isCanvasReady = false;
let canvasInitPromise: Promise<void> | null = null;

// 7. Mount PixiJS Canvas to DOM
async function bootstrapCanvas(): Promise<void> {
  try {
    await slotView.init(canvasMount, fsm, stateStore, soundSystem);
    winBanner.setParticleManager(slotView.particleManager);

    // Set initial grid defensively (handling null or missing grid in currentRoundData)
    const currentRound = stateStore.getState().currentRoundData;
    const initialGrid =
      currentRound && Array.isArray(currentRound.grid) && currentRound.grid.length === 5
        ? currentRound.grid
        : generateRandomGrid().grid;

    slotView.setInitialGrid(initialGrid);

    // If session recovered was in Free Spins, activate Free Spins board mode
    if (recovery.wasInFreeSpins && stateStore.getState().freeSpinsLeft > 0) {
      slotView.setFreeSpinsMode(true);
    }

    // FPS Ticker
    let lastTime = performance.now();
    let frameCount = 0;
    slotView.app.ticker.add(() => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        fpsCounter.textContent = `${fps} FPS`;
        frameCount = 0;
        lastTime = now;
      }
    });
  } catch (err) {
    console.error('[SlotKita] Canvas initialization error:', err);
  } finally {
    isCanvasReady = true;
    controls.syncVisuals();
  }
}

canvasInitPromise = bootstrapCanvas();

// ==========================================
// Master Spin Lifecycle Execution
// ==========================================
async function executeSpinCycle(): Promise<void> {
  if (!isCanvasReady && canvasInitPromise) {
    await canvasInitPromise;
  }

  const currentState = fsm.currentState;
  const isFreeSpinMode = currentState === SlotState.FREE_SPINS || stateStore.getState().freeSpinsLeft > 0;
  let result: SpinResult;

  try {
    // 1. Bet Processing & Sound Start
    if (isFreeSpinMode) {
      const consumed = stateStore.consumeFreeSpin();
      if (!consumed) {
        if (slotView.freeSpinEngine && slotView.freeSpinEngine.isActive) {
          slotView.freeSpinEngine.showSummaryModal(() => {
            slotView.setFreeSpinsMode(false);
            fsm.transitionTo(SlotState.IDLE);
          });
        } else {
          slotView.setFreeSpinsMode(false);
          fsm.transitionTo(SlotState.IDLE);
        }
        return;
      }

      slotView.freeSpinEngine?.recordSpinPlayed();
      slotView.setFreeSpinsMode(true);
      fsm.transitionTo(SlotState.SPINNING);
      soundSystem.playSpinStart();

      // Enriched Free Spin Strips: All royals (9, 10, J, Q, K, A) removed!
      result = slotView.freeSpinEngine
        ? slotView.freeSpinEngine.generateEnrichedSpin(1)
        : WinEvaluator.spin(1);
    } else {
      slotView.setFreeSpinsMode(false);
      if (!fsm.canTransitionTo(SlotState.BET_SUBMITTED)) return;
      fsm.transitionTo(SlotState.BET_SUBMITTED);

      const deducted = stateStore.deductBet();
      if (!deducted) {
        alert('Saldo koin Anda tidak mencukupi untuk memasang taruhan ini!');
        fsm.transitionTo(SlotState.IDLE);
        stateStore.stopAutoSpin();
        return;
      }

      // Contribute portion of bet to progressive jackpot meters
      hud.contributeBet(stateStore.getState().currentBet);

      fsm.transitionTo(SlotState.SPINNING);
      soundSystem.playSpinStart();
      result = WinEvaluator.spin(1);
    }

    stateStore.setCurrentRound(result);

    // 2. Drive Visual Reel Animation & Wild Coin-Feeding in PixiJS Canvas
    const spinOutcome = await slotView.spin(result, isFreeSpinMode);

    // 3. Evaluating & Win Calculation
    if (fsm.canTransitionTo(SlotState.EVALUATING)) {
      fsm.transitionTo(SlotState.EVALUATING);
    }

    const currentBet = stateStore.getState().currentBet;
    const betMultiplier = currentBet / BASE_BET;
    const totalPayout = Math.round(result.totalWin * betMultiplier);

    if (totalPayout > 0) {
      stateStore.creditWin(totalPayout);
    }

    // Free Spins feature awarded (or retriggered)
    if (result.isFreeSpinsTriggered) {
      stateStore.awardFreeSpins(result.freeSpinsAwarded);
      if (!isFreeSpinMode) {
        slotView.freeSpinEngine?.startSession();
        slotView.setFreeSpinsMode(true);
      }
    }

    // Update UI Summary
    if (totalPayout > 0) {
      const wayDetails = result.winningWays
        .map(
          (w: WinWay) =>
            `<span class="inline-block px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 mr-2 mb-1">
              <strong>${w.symbolName}</strong> ${w.matchCount}x (${w.wayCount} ways) = +${(w.totalPayout * betMultiplier).toLocaleString('id-ID')}
            </span>`
        )
        .join('');

      const multiplier = currentBet > 0 ? totalPayout / currentBet : 0;
      const winTierLabel =
        multiplier >= 100
          ? '👑 SUPER WIN'
          : multiplier >= 50
          ? '🔥 MEGA WIN'
          : multiplier >= 20
          ? '✨ BIG WIN'
          : '🎉 MENANG';

      spinSummary.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="text-emerald-300 font-bold text-sm">${winTierLabel}: ${totalPayout.toLocaleString('id-ID')} Koin (${multiplier.toFixed(2)}x Bet)</span>
        </div>
        ${
          result.isFreeSpinsTriggered
            ? `<div class="p-2 mb-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center gap-2">
                <span>🔥</span> ${isFreeSpinMode ? 'RETRIGGER!' : 'FREE SPINS DIPICU!'} +${result.freeSpinsAwarded} Putaran Gratis!
              </div>`
            : ''
        }
        <div class="flex flex-wrap text-xs">${wayDetails}</div>
      `;

      // 4. Tiered Win Celebration (Big Win >= 20x, Mega Win >= 50x, Super Win >= 100x)
      const isTierCelebrated = winBanner.showIfEligible(totalPayout, currentBet, () => {
        // Completed rolling celebration
      });

      if (!isTierCelebrated) {
        // Standard win sound and minor coin shower
        soundSystem.playCoinRollup();
        if (multiplier >= 5) {
          slotView.particleManager.triggerCoinShower(2.0, 2);
        }
      }

      if (fsm.canTransitionTo(SlotState.WIN_CELEBRATION)) {
        fsm.transitionTo(SlotState.WIN_CELEBRATION);
        await new Promise((resolve) => setTimeout(resolve, stateStore.getState().isTurbo ? 350 : 800));
      }
    } else {
      spinSummary.innerHTML = `<span class="text-slate-400">Tidak ada kombinasi menang pada putaran ini.</span>`;
    }

    // 5. Mini-Game Jackpot Bonus Trigger (from Fu Pot Explosion)
    if (spinOutcome.isJackpotTriggered && slotView.jackpotModal) {
      if (fsm.canTransitionTo(SlotState.JACKPOT_BONUS)) {
        fsm.transitionTo(SlotState.JACKPOT_BONUS);
      }

      await new Promise<void>((resolveJackpot) => {
        slotView.jackpotModal!.open((wonTier, jackpotWin) => {
          stateStore.creditWin(jackpotWin);
          spinSummary.innerHTML = `
            <div class="p-2.5 mb-1.5 rounded-xl bg-yellow-500/20 border border-yellow-400 text-yellow-200 font-bold text-sm flex items-center justify-between shadow-lg">
              <span>🎉 SELAMAT! ANDA MEMENANGKAN <strong>${wonTier} JACKPOT</strong>: +${jackpotWin.toLocaleString('id-ID')} Koin!</span>
            </div>
          `;
          resolveJackpot();
        });
      });
    }

    // 6. Post-spin Transition & Free Spins / Auto Continuations
    if (stateStore.getState().freeSpinsLeft > 0) {
      if (fsm.currentState !== SlotState.FREE_SPINS) {
        fsm.transitionTo(SlotState.FREE_SPINS);
      }
      setTimeout(() => {
        if (fsm.currentState === SlotState.FREE_SPINS && stateStore.getState().freeSpinsLeft > 0) {
          executeSpinCycle();
        }
      }, stateStore.getState().isTurbo ? 300 : 900);
    } else {
      // Check if we just completed a Free Spins session
      if (isFreeSpinMode && slotView.freeSpinEngine) {
        slotView.freeSpinEngine.showSummaryModal(() => {
          slotView.setFreeSpinsMode(false);
          stateStore.resetFreeSpinsSession();
          fsm.transitionTo(SlotState.IDLE);

          if (stateStore.getState().isAutoSpin) {
            const continueAuto = stateStore.decrementAutoSpin();
            if (continueAuto) {
              setTimeout(() => {
                if (fsm.currentState === SlotState.IDLE && stateStore.getState().isAutoSpin) {
                  executeSpinCycle();
                }
              }, stateStore.getState().isTurbo ? 250 : 700);
            }
          }
        });
      } else {
        fsm.transitionTo(SlotState.IDLE);

        if (stateStore.getState().isAutoSpin) {
          const continueAuto = stateStore.decrementAutoSpin();
          if (continueAuto) {
            setTimeout(() => {
              if (fsm.currentState === SlotState.IDLE && stateStore.getState().isAutoSpin) {
                executeSpinCycle();
              }
            }, stateStore.getState().isTurbo ? 250 : 700);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SlotKita] Spin cycle error occurred, recovering safely to IDLE:', error);
    if (fsm.canTransitionTo(SlotState.IDLE)) {
      fsm.transitionTo(SlotState.IDLE);
    }
    stateStore.stopAutoSpin();
  }
}

// ==========================================
// System Reset Handler
// ==========================================
const resetSessionBtn = document.querySelector<HTMLButtonElement>('#resetSessionBtn');
if (resetSessionBtn) {
  resetSessionBtn.addEventListener('click', () => {
    soundSystem.playUiClick();
    if (confirm('Apakah Anda yakin ingin mereset sesi dan mengembalikan saldo ke 10.000.000 koin?')) {
      SessionPersistence.clearSession();
      stateStore.restoreState({
        balance: 10_000_000,
        freeSpinsLeft: 0,
        totalFreeSpinsWon: 0,
        winAmount: 0,
        isAutoSpin: false,
        autoSpinCount: 0,
      });
      fsm.forceState(SlotState.IDLE);
      slotView.clearWins();
      slotView.setFreeSpinsMode(false);
      if (recoveryBanner) recoveryBanner.classList.add('hidden');
    }
  });
}

if (dismissBannerBtn) {
  dismissBannerBtn.addEventListener('click', () => {
    soundSystem.playUiClick();
    recoveryBanner.classList.add('hidden');
  });
}
