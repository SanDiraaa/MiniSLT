/**
 * SlotKita - Tiered Big Win, Mega Win, and Super Win Celebration Overlay
 * Phase 5: GSAP Rolling Coin Counter, Tap-To-Skip, and Dynamic Audio Synchronization
 */

import { gsap } from 'gsap';
import { SoundSystem } from '../core/SoundSystem';
import { ParticleManager } from '../game/ParticleManager';

export enum WinTier {
  BIG_WIN = 'BIG_WIN',
  MEGA_WIN = 'MEGA_WIN',
  SUPER_WIN = 'SUPER_WIN',
}

export interface WinTierConfig {
  tier: WinTier;
  title: string;
  minMultiplier: number;
  badgeBg: string;
  textColor: string;
  glowColor: string;
  icon: string;
}

export const WIN_TIERS: Record<WinTier, WinTierConfig> = {
  [WinTier.SUPER_WIN]: {
    tier: WinTier.SUPER_WIN,
    title: 'SUPER WIN',
    minMultiplier: 100,
    badgeBg: 'from-amber-500 via-yellow-400 to-amber-600',
    textColor: '#fff59d',
    glowColor: 'rgba(255, 215, 0, 0.8)',
    icon: '👑 🐉 👑',
  },
  [WinTier.MEGA_WIN]: {
    tier: WinTier.MEGA_WIN,
    title: 'MEGA WIN',
    minMultiplier: 50,
    badgeBg: 'from-rose-600 via-amber-500 to-rose-700',
    textColor: '#ffcc80',
    glowColor: 'rgba(255, 69, 0, 0.7)',
    icon: '🔥 🦚 🔥',
  },
  [WinTier.BIG_WIN]: {
    tier: WinTier.BIG_WIN,
    title: 'BIG WIN',
    minMultiplier: 20,
    badgeBg: 'from-yellow-600 via-amber-500 to-yellow-700',
    textColor: '#ffe082',
    glowColor: 'rgba(255, 193, 7, 0.6)',
    icon: '✨ 🐯 ✨',
  },
};

export class WinBanner {
  private _container: HTMLElement;
  private _soundSystem: SoundSystem;
  private _particleManager?: ParticleManager;

  private _overlayEl!: HTMLElement;
  private _titleEl!: HTMLElement;
  private _amountEl!: HTMLElement;
  private _iconEl!: HTMLElement;
  private _multiplierEl!: HTMLElement;
  private _claimHintEl!: HTMLElement;

  private _rollTween?: gsap.core.Tween;
  private _isRolling: boolean = false;
  private _currentTotalWin: number = 0;
  private _onCompleteCallback?: () => void;
  private _lastCoinSoundTime: number = 0;

  constructor(container: HTMLElement, soundSystem: SoundSystem, particleManager?: ParticleManager) {
    this._container = container;
    this._soundSystem = soundSystem;
    this._particleManager = particleManager;

    this.render();
    this.bindClickEvents();
  }

  public setParticleManager(pm: ParticleManager): void {
    this._particleManager = pm;
  }

  private render(): void {
    this._overlayEl = document.createElement('div');
    this._overlayEl.id = 'winCelebrationOverlay';
    this._overlayEl.className = 'hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none cursor-pointer';

    this._overlayEl.innerHTML = `
      <div id="winBannerCard" class="relative max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-rose-950 via-slate-950 to-black border-4 border-amber-400 shadow-[0_0_80px_rgba(255,215,0,0.4)] text-center flex flex-col items-center">
        <!-- Floating Chinese Golden Coins Ring -->
        <div id="winBannerIcon" class="text-3xl sm:text-4xl mb-2 animate-bounce">
          ✨ 🐯 ✨
        </div>

        <!-- Tier Title: BIG WIN / MEGA WIN / SUPER WIN -->
        <div id="winBannerTitle" class="text-3xl sm:text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] mb-1">
          BIG WIN
        </div>

        <div id="winBannerMultiplier" class="text-xs sm:text-sm font-bold text-amber-300 font-mono tracking-wider mb-4">
          25.00x Taruhan
        </div>

        <!-- Rolling Amount Display -->
        <div class="w-full py-3 px-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-inner mb-4">
          <div class="text-[10px] text-amber-400/80 uppercase font-black tracking-widest mb-0.5">TOTAL KEMENANGAN</div>
          <div id="winBannerAmount" class="text-3xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-300 to-amber-400 drop-shadow-md tracking-tight">
            0
          </div>
        </div>

        <!-- Skip / Claim Hint -->
        <div id="winBannerClaimHint" class="text-xs text-amber-300/80 font-bold uppercase tracking-widest animate-pulse">
          Ketuk layar untuk mempercepat hitungan (Skip) ⏩
        </div>
      </div>
    `;

    this._container.appendChild(this._overlayEl);

    this._titleEl = this._overlayEl.querySelector('#winBannerTitle')!;
    this._amountEl = this._overlayEl.querySelector('#winBannerAmount')!;
    this._iconEl = this._overlayEl.querySelector('#winBannerIcon')!;
    this._multiplierEl = this._overlayEl.querySelector('#winBannerMultiplier')!;
    this._claimHintEl = this._overlayEl.querySelector('#winBannerClaimHint')!;
  }

  private bindClickEvents(): void {
    this._overlayEl.addEventListener('click', () => {
      if (this._isRolling) {
        // Skip roll-up immediately to final win amount
        this.skipRollup();
      } else {
        // Dismiss celebration
        this.closeBanner();
      }
    });
  }

  /**
   * Evaluates payout and presents tiered celebration if payout meets threshold (>= 20x).
   *
   * @param totalWin Total payout won
   * @param betAmount Current total bet
   * @param onComplete Callback invoked when celebration finishes
   * @returns boolean true if tiered celebration was triggered, false otherwise
   */
  public showIfEligible(
    totalWin: number,
    betAmount: number,
    onComplete: () => void
  ): boolean {
    if (betAmount <= 0) {
      onComplete();
      return false;
    }

    const multiplier = totalWin / betAmount;

    // Check tier eligibility
    let tierConfig: WinTierConfig | null = null;
    if (multiplier >= WIN_TIERS[WinTier.SUPER_WIN].minMultiplier) {
      tierConfig = WIN_TIERS[WinTier.SUPER_WIN];
    } else if (multiplier >= WIN_TIERS[WinTier.MEGA_WIN].minMultiplier) {
      tierConfig = WIN_TIERS[WinTier.MEGA_WIN];
    } else if (multiplier >= WIN_TIERS[WinTier.BIG_WIN].minMultiplier) {
      tierConfig = WIN_TIERS[WinTier.BIG_WIN];
    }

    if (!tierConfig) {
      onComplete();
      return false;
    }

    this.presentCelebration(tierConfig, totalWin, multiplier, onComplete);
    return true;
  }

  private presentCelebration(
    cfg: WinTierConfig,
    totalWin: number,
    multiplier: number,
    onComplete: () => void
  ): void {
    this._currentTotalWin = totalWin;
    this._onCompleteCallback = onComplete;
    this._isRolling = true;

    // Update UI Elements
    this._titleEl.textContent = cfg.title;
    this._iconEl.textContent = cfg.icon;
    this._multiplierEl.textContent = `${multiplier.toFixed(2)}x Total Taruhan`;
    this._amountEl.textContent = '0';
    this._claimHintEl.textContent = 'Ketuk layar untuk mempercepat hitungan (Skip) ⏩';

    // Play Big Win Gong & Fanfare
    this._soundSystem.playBigWinGong();

    // Trigger GPU Coin Shower if available
    if (this._particleManager) {
      const showerDuration = cfg.tier === WinTier.SUPER_WIN ? 5.0 : cfg.tier === WinTier.MEGA_WIN ? 4.0 : 3.0;
      const intensity = cfg.tier === WinTier.SUPER_WIN ? 5 : cfg.tier === WinTier.MEGA_WIN ? 4 : 3;
      this._particleManager.triggerCoinShower(showerDuration, intensity);
    }

    // Unhide and pop-in overlay
    this._overlayEl.classList.remove('hidden');
    const card = this._overlayEl.querySelector('#winBannerCard')!;
    gsap.fromTo(
      card,
      { scale: 0.3, opacity: 0 },
      { scale: 1.0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' }
    );

    // Roll-up Counter GSAP animation
    const counterObj = { val: 0 };
    const rollDuration = cfg.tier === WinTier.SUPER_WIN ? 3.5 : cfg.tier === WinTier.MEGA_WIN ? 2.8 : 2.0;

    this._rollTween = gsap.to(counterObj, {
      val: totalWin,
      duration: rollDuration,
      ease: 'power2.out',
      onUpdate: () => {
        this._amountEl.textContent = Math.floor(counterObj.val).toLocaleString('id-ID');

        // Play rapid coin sound periodically
        const now = performance.now();
        if (now - this._lastCoinSoundTime > 90) {
          this._soundSystem.playCoinRollup();
          this._lastCoinSoundTime = now;
        }
      },
      onComplete: () => {
        this.onRollupFinished();
      },
    });
  }

  private skipRollup(): void {
    if (this._rollTween) {
      this._rollTween.kill();
      this._rollTween = undefined;
    }
    this.onRollupFinished();
  }

  private onRollupFinished(): void {
    this._isRolling = false;
    this._amountEl.textContent = Math.floor(this._currentTotalWin).toLocaleString('id-ID');
    this._claimHintEl.textContent = '🎉 KETUK LAYAR UNTUK MENGKLAIM 🎉';
    this._soundSystem.playCoinRollup();

    // Subtle breathing pulse on claim text
    gsap.to(this._claimHintEl, { scale: 1.05, repeat: -1, yoyo: true, duration: 0.4 });
  }

  private closeBanner(): void {
    const card = this._overlayEl.querySelector('#winBannerCard')!;
    gsap.to(card, {
      scale: 0.7,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this._overlayEl.classList.add('hidden');
        this._soundSystem.unduck();
        if (this._onCompleteCallback) {
          const cb = this._onCompleteCallback;
          this._onCompleteCallback = undefined;
          cb();
        }
      },
    });
  }
}
