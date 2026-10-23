/**
 * SlotKita - Free Spins Feature Engine
 * Phase 4: Enriched High-Pay Strips (No Royals), Scatter Retriggers, and Grand Summary Celebration
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { GameStateStore } from '../core/GameState';
import { StateMachine, SlotState } from '../core/FSM';
import { ParticleManager } from './ParticleManager';
import { generateFreeSpinRandomGrid } from '../math/ReelStrips';
import { WinEvaluator } from '../math/WinEvaluator';
import { SpinResult } from '../math/Types';

export class FreeSpinEngine extends Container {
  private _stateStore: GameStateStore;
  private _fsm: StateMachine;
  private _particleManager: ParticleManager;
  private _summaryModal: Container;
  private _isActive: boolean = false;
  private _totalSpinsPlayed: number = 0;

  constructor(stateStore: GameStateStore, fsm: StateMachine, particleManager: ParticleManager) {
    super();
    this._stateStore = stateStore;
    this._fsm = fsm;
    this._particleManager = particleManager;

    this.visible = false;
    this._summaryModal = new Container();
    this.addChild(this._summaryModal);
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Generates a spin result using the Enriched Free Spin Strips.
   * All low-pay card ranks (9, 10, J, Q, K, A) have been removed!
   */
  public generateEnrichedSpin(betMultiplier: number = 1): SpinResult {
    const { grid, stops } = generateFreeSpinRandomGrid();
    return WinEvaluator.evaluate(grid, stops, betMultiplier);
  }

  /**
   * Increments the played spins counter during an active feature.
   */
  public recordSpinPlayed(): void {
    this._totalSpinsPlayed++;
  }

  /**
   * Resets feature session metrics.
   */
  public startSession(): void {
    this._isActive = true;
    this._totalSpinsPlayed = 0;
  }

  /**
   * Displays the Grand Free Spins Celebration Summary Modal upon completion.
   *
   * @param onDismiss Callback invoked when player dismisses summary to return to base game
   */
  public showSummaryModal(onDismiss: () => void): void {
    this._isActive = false;
    this.visible = true;
    this.alpha = 0;

    const totalWon = this._stateStore.getState().totalFreeSpinsWon;
    const currentBet = this._stateStore.getState().currentBet;
    const multiplier = currentBet > 0 ? (totalWon / currentBet).toFixed(1) : '0';

    this.renderSummary(totalWon, multiplier, onDismiss);

    gsap.to(this, { alpha: 1, duration: 0.4, ease: 'power2.out' });

    // Trigger celebratory coin shower
    this._particleManager.triggerCoinShower(4.0, 4);
  }

  private renderSummary(totalWon: number, multiplierStr: string, onDismiss: () => void): void {
    const screenWidth = 830;
    const screenHeight = 580;

    this._summaryModal.removeChildren();

    // Backdrop
    const bg = new Graphics();
    bg.rect(0, 0, screenWidth, screenHeight).fill({ color: 0x050204, alpha: 0.92 });
    this._summaryModal.addChild(bg);

    // Modal Box
    const box = new Container();
    box.position.set(screenWidth / 2, screenHeight / 2);

    const boxBg = new Graphics();
    boxBg
      .roundRect(-240, -130, 480, 260, 20)
      .fill({ color: 0x1f060c, alpha: 0.98 })
      .stroke({ color: 0xffd700, width: 4 });
    box.addChild(boxBg);

    // Header Title
    const titleStyle = new TextStyle({
      fontFamily: 'Impact, sans-serif',
      fontSize: 26,
      fontWeight: 'bold',
      fill: [0xfff3a8, 0xffd700, 0xff8800],
      dropShadow: { alpha: 0.9, angle: Math.PI / 4, blur: 4, color: 0x000000, distance: 2 },
    });
    const titleText = new Text({ text: '🔥 PUTARAN GRATIS SELESAI! 🔥', style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.position.set(0, -75);
    box.addChild(titleText);

    // Subtitle
    const subStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      fill: 0xffcda3,
    });
    const subText = new Text({
      text: `Total ${this._totalSpinsPlayed} Putaran Dimainkan (Mode Simbol Emas Tinggi)`,
      style: subStyle,
    });
    subText.anchor.set(0.5);
    subText.position.set(0, -45);
    box.addChild(subText);

    // Total Won Amount
    const winStyle = new TextStyle({
      fontFamily: 'monospace, Arial',
      fontSize: 34,
      fontWeight: '900',
      fill: 0xffea00,
      dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 3, color: 0x5a0000, distance: 2 },
    });
    const winText = new Text({ text: `+${totalWon.toLocaleString()} Koin`, style: winStyle });
    winText.anchor.set(0.5);
    winText.position.set(0, 0);
    box.addChild(winText);

    // Multiplier Text
    const multStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0x00ff88,
    });
    const multText = new Text({ text: `(${multiplierStr}x Total Taruhan)`, style: multStyle });
    multText.anchor.set(0.5);
    multText.position.set(0, 32);
    box.addChild(multText);

    // Claim & Return to Base Game Button
    const claimBtn = new Container();
    claimBtn.position.set(0, 78);
    claimBtn.eventMode = 'static';
    claimBtn.cursor = 'pointer';

    const btnBg = new Graphics();
    btnBg.roundRect(-110, -20, 220, 40, 10)
      .fill(0xd4af37)
      .stroke({ color: 0xffffff, width: 2 });
    claimBtn.addChild(btnBg);

    const btnStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 13,
      fontWeight: '900',
      fill: 0x4a0e17,
      letterSpacing: 1,
    });
    const btnText = new Text({ text: 'KEMBALI KE GAME UTAMA', style: btnStyle });
    btnText.anchor.set(0.5);
    claimBtn.addChild(btnText);

    claimBtn.on('pointertap', () => {
      gsap.to(this, {
        alpha: 0,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          this.visible = false;
          this._stateStore.resetFreeSpinsSession();
          if (this._fsm.currentState !== SlotState.IDLE) {
            this._fsm.transitionTo(SlotState.IDLE);
          }
          onDismiss();
        },
      });
    });

    box.addChild(claimBtn);
    this._summaryModal.addChild(box);

    gsap.fromTo(
      box.scale,
      { x: 0.4, y: 0.4 },
      { x: 1.0, y: 1.0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }
    );
  }
}
