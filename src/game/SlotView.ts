/**
 * SlotKita - 5-Reel Slot View Orchestrator
 * Phase 4: Fu Pot Progression, Squash & Stretch, 12-Coin Jackpot Bonus & Enriched Free Spins
 */

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { Reel, CELL_HEIGHT } from './Reel';
import { SymbolId, SpinResult, WinWay } from '../math/Types';
import { REEL_COUNT, VISIBLE_ROWS } from '../math/ReelStrips';
import { StateMachine, SlotState } from '../core/FSM';
import { FuPot } from './FuPot';
import { ParticleManager } from './ParticleManager';
import { JackpotModal } from './JackpotModal';
import { FreeSpinEngine } from './FreeSpinEngine';
import { GameStateStore } from '../core/GameState';
import { SoundSystem } from '../core/SoundSystem';

export const REEL_WIDTH = 154;
export const BOARD_WIDTH = REEL_COUNT * REEL_WIDTH; // 770px
export const BOARD_HEIGHT = VISIBLE_ROWS * CELL_HEIGHT; // 450px
export const CANVAS_WIDTH = BOARD_WIDTH + 60; // 830px
export const CANVAS_HEIGHT = BOARD_HEIGHT + 130; // 580px

export interface SpinVisualOutcome {
  isJackpotTriggered: boolean;
}

export class SlotView {
  public app: Application;
  public stage: Container;
  private _reels: Reel[] = [];
  private _boardContainer: Container;
  private _reelsContainer: Container;
  private _viewportMask: Graphics;
  private _ornateFrame: Graphics;
  private _anticipationFrames: Graphics[] = [];
  private _fsm?: StateMachine;
  private _soundSystem?: SoundSystem;
  private _stateStore?: GameStateStore;

  // Phase 4 components
  public fuPot: FuPot;
  public particleManager: ParticleManager;
  public jackpotModal?: JackpotModal;
  public freeSpinEngine?: FreeSpinEngine;
  private _freeSpinsBanner: Container;
  private _delayedCalls: gsap.core.Tween[] = [];

  constructor() {
    this.app = new Application();
    this.stage = new Container();
    this._boardContainer = new Container();
    this._reelsContainer = new Container();
    this._viewportMask = new Graphics();
    this._ornateFrame = new Graphics();
    this._freeSpinsBanner = new Container();

    this.particleManager = new ParticleManager();
    this.fuPot = new FuPot();
  }

  /**
   * Initializes Pixi.js WebGL application and mounts canvas to DOM element.
   *
   * @param containerElement HTML DOM element to append canvas into
   * @param fsm Optional StateMachine to synchronize state events with
   * @param stateStore Optional GameStateStore for jackpot meters and payouts
   * @param soundSystem Optional SoundSystem for interactive audio effects
   */
  public async init(
    containerElement: HTMLElement,
    fsm?: StateMachine,
    stateStore?: GameStateStore,
    soundSystem?: SoundSystem
  ): Promise<void> {
    this._fsm = fsm;
    this._soundSystem = soundSystem;
    this._stateStore = stateStore;

    // Initialize Pixi v8 Application
    await this.app.init({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Clear container to avoid duplicate canvas on re-init / HMR
    containerElement.innerHTML = '';
    containerElement.appendChild(this.app.canvas);
    this.app.stage.addChild(this.stage);

    if (stateStore && fsm) {
      this.jackpotModal = new JackpotModal(this.particleManager, stateStore, soundSystem);
      this.freeSpinEngine = new FreeSpinEngine(stateStore, fsm, this.particleManager);
    }

    this.setupBoard();
  }

  /**
   * Builds 5-reel columns, ornate oriental pagoda frame, viewport mask, and Fu Pot pedestal.
   */
  private setupBoard(): void {
    const offsetX = 30;
    const offsetY = 100;

    this._boardContainer.position.set(offsetX, offsetY);
    this.stage.addChild(this._boardContainer);

    // 1. Board Background Texture
    const bgPlate = new Graphics();
    bgPlate
      .roundRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT, 14)
      .fill({ color: 0x0f0305, alpha: 0.95 });
    this._boardContainer.addChild(bgPlate);

    // 2. Add Reel Columns
    for (let r = 0; r < REEL_COUNT; r++) {
      const reel = new Reel(r);
      reel.position.set(r * REEL_WIDTH, 0);
      this._reels.push(reel);
      this._reelsContainer.addChild(reel);
    }
    this._boardContainer.addChild(this._reelsContainer);

    // 3. 5x3 Viewport Mask (smooth hiding of top & bottom buffer symbols)
    this._viewportMask
      .roundRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT, 14)
      .fill(0xffffff);
    this._boardContainer.addChild(this._viewportMask);
    this._reelsContainer.mask = this._viewportMask;

    // 4. Subtle column separators (Gold filigree lines)
    const separators = new Graphics();
    for (let r = 1; r < REEL_COUNT; r++) {
      separators
        .rect(r * REEL_WIDTH - 1, 0, 2, BOARD_HEIGHT)
        .fill({ color: 0xd4af37, alpha: 0.25 });
    }
    this._boardContainer.addChild(separators);

    // 5. Anticipation Tension Frames for Reels 2, 3, 4
    this.setupAnticipationFrames();

    // 6. Master Ornate Oriental Frame (Pagoda Roof, Dragon Brackets, Gold Pedestal)
    this.renderOrnateOrientalFrame(offsetX, offsetY);

    // 7. Interactive Golden Fu Pot mounted at top center above reels
    this.fuPot.position.set(CANVAS_WIDTH / 2, 52);
    this.stage.addChild(this.fuPot);

    // 8. Free Spins Indicator Banner (mounted above reels)
    this.setupFreeSpinsBanner(CANVAS_WIDTH / 2, 90);

    // 9. GPU Particle Layer
    this.stage.addChild(this.particleManager);

    // 10. Modals Layer
    if (this.jackpotModal) {
      this.stage.addChild(this.jackpotModal);
    }
    if (this.freeSpinEngine) {
      this.stage.addChild(this.freeSpinEngine);
    }
  }

  /**
   * Constructs pulsating gold anticipation tease frames for reels 2, 3, 4.
   */
  private setupAnticipationFrames(): void {
    for (let r = 0; r < REEL_COUNT; r++) {
      const frame = new Graphics();
      frame.position.set(r * REEL_WIDTH, 0);

      // Flashing golden outer border
      frame
        .roundRect(1, 1, REEL_WIDTH - 2, BOARD_HEIGHT - 2, 8)
        .stroke({ color: 0xffd700, width: 4, alpha: 1 })
        .fill({ color: 0xff4500, alpha: 0.15 });

      frame.visible = false;
      this._anticipationFrames.push(frame);
      this._boardContainer.addChild(frame);
    }
  }

  /**
   * Setup ornate Free Spins active status banner on top of the slot reels.
   */
  private setupFreeSpinsBanner(centerX: number, y: number): void {
    this._freeSpinsBanner.position.set(centerX, y);
    this._freeSpinsBanner.visible = false;

    const bg = new Graphics();
    bg.roundRect(-220, -12, 440, 24, 8)
      .fill({ color: 0x5a0a14, alpha: 0.95 })
      .stroke({ color: 0xffd700, width: 2 });
    this._freeSpinsBanner.addChild(bg);

    const txtStyle = new TextStyle({
      fontFamily: 'Impact, Arial, sans-serif',
      fontSize: 12,
      fontWeight: 'bold',
      fill: [0xfff3a8, 0xffd700],
      letterSpacing: 1,
    });
    const label = new Text({
      text: '🔥 FREE SPINS AKTIF: SIMBOL EMAS TINGGI (KARTU DIHAPUS) 🔥',
      style: txtStyle,
    });
    label.anchor.set(0.5);
    this._freeSpinsBanner.addChild(label);

    this.stage.addChild(this._freeSpinsBanner);
  }

  /**
   * Toggles the Free Spins visual mode on the board.
   */
  public setFreeSpinsMode(isActive: boolean): void {
    this._freeSpinsBanner.visible = isActive;
    if (isActive) {
      gsap.to(this._freeSpinsBanner, {
        alpha: 0.5,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    } else {
      gsap.killTweensOf(this._freeSpinsBanner);
      this._freeSpinsBanner.alpha = 1.0;
    }
  }

  /**
   * Renders traditional oriental palace architecture around the slot grid and Fu Pot.
   */
  private renderOrnateOrientalFrame(ox: number, oy: number): void {
    const g = this._ornateFrame;
    g.clear();

    const w = BOARD_WIDTH;
    const h = BOARD_HEIGHT;

    // Outer Heavy Golden Rim
    g.roundRect(ox - 10, oy - 10, w + 20, h + 20, 18)
      .stroke({ color: 0xd4af37, width: 5 })
      .fill({ color: 0x4a0e17, alpha: 0.4 });

    // Inner Filigree Line
    g.roundRect(ox - 4, oy - 4, w + 8, h + 8, 14)
      .stroke({ color: 0xffd700, width: 1.5, alpha: 0.7 });

    // Corner Chinese Dragon/Cloud Brackets
    const cornerSize = 24;
    const corners = [
      { x: ox - 12, y: oy - 12 },
      { x: ox + w - cornerSize + 12, y: oy - 12 },
      { x: ox - 12, y: oy + h - cornerSize + 12 },
      { x: ox + w - cornerSize + 12, y: oy + h - cornerSize + 12 },
    ];

    for (const c of corners) {
      g.roundRect(c.x, c.y, cornerSize, cornerSize, 4)
        .fill(0xffd700)
        .stroke({ color: 0x8b0000, width: 2 });
      g.circle(c.x + cornerSize / 2, c.y + cornerSize / 2, 4).fill(0x8b0000);
    }

    // Top Imperial Roof Emblem & Pedestal for Fu Pot
    const centerX = ox + w / 2;

    // Pedestal Base
    g.poly([
      centerX - 70, oy - 8,
      centerX - 50, oy - 18,
      centerX + 50, oy - 18,
      centerX + 70, oy - 8,
    ]).fill(0x8b0000).stroke({ color: 0xffd700, width: 2.5 });

    // Golden Dragon Clouds supporting pot
    g.circle(centerX - 65, oy - 14, 8).fill(0xd4af37);
    g.circle(centerX + 65, oy - 14, 8).fill(0xd4af37);

    // Left & Right Temple Roof Ridge Horns
    g.poly([
      ox + 10, oy - 8,
      ox + 50, oy - 22,
      ox + 90, oy - 8,
    ]).fill(0x8b0000).stroke({ color: 0xd4af37, width: 2 });

    g.poly([
      ox + w - 90, oy - 8,
      ox + w - 50, oy - 22,
      ox + w - 10, oy - 8,
    ]).fill(0x8b0000).stroke({ color: 0xd4af37, width: 2 });

    this.stage.addChild(g);
  }

  /**
   * Executes a full 5-reel spin sequence with staggered stops, anticipation tease,
   * Bezier Wild coin-feeding to Fu Pot, and random jackpot triggers.
   *
   * @param spinResult Pre-computed math spin result
   * @param isFreeSpins If true, uses enriched high-pay strips (no card royals)
   * @returns SpinVisualOutcome indicating whether Fu Pot exploded and triggered Jackpot Mini-Game
   */
  public async spin(
    spinResult: SpinResult,
    isFreeSpins: boolean = false
  ): Promise<SpinVisualOutcome> {
    if (this._reels.length < REEL_COUNT) {
      console.warn('[SlotView] Reels not fully initialized yet');
      return { isJackpotTriggered: false };
    }

    this.clearWins();
    this.hideAllAnticipations();

    // Kill any active reel delayedCalls from previous spin
    for (const call of this._delayedCalls) {
      call.kill();
    }
    this._delayedCalls = [];

    // 1. Start all 5 reels spinning
    for (let r = 0; r < REEL_COUNT; r++) {
      this._reels[r].startSpin(isFreeSpins);
    }

    // 2. Check for Anticipation Tease (≥ 2 Scatters on early reels)
    const scatterReels: number[] = [];

    for (let r = 0; r < REEL_COUNT; r++) {
      let reelHasScatter = false;
      for (let row = 0; row < VISIBLE_ROWS; row++) {
        if (spinResult.grid[r][row] === SymbolId.SCATTER) {
          reelHasScatter = true;
          break;
        }
      }
      if (reelHasScatter) {
        scatterReels.push(r);
      }
    }

    const isAnticipationEligible =
      scatterReels.includes(0) && scatterReels.includes(1);

    // 3. Staggered Stopping sequence with minimum spin duration
    const isTurbo = this._stateStore?.getState().isTurbo ?? false;
    const minSpinDuration = isTurbo ? 0.35 : 1.1; // All 5 reels spin visibly for at least this long
    const staggerInterval = isTurbo ? 0.1 : 0.22; // Sequential clack landing spacing

    const stopPromises: Promise<void>[] = [];

    for (let r = 0; r < REEL_COUNT; r++) {
      const isTeaseReel = isAnticipationEligible && r >= 2;
      const targetStop = spinResult.stopIndices[r];

      // Delay before initiating stop on this reel
      let reelDelaySeconds = minSpinDuration + r * staggerInterval;
      if (isTeaseReel) {
        reelDelaySeconds += 1.2; // Extra anticipation tension time
      }

      const reelPromise = new Promise<void>((resolve) => {
        const call = gsap.delayedCall(reelDelaySeconds, () => {
          if (isTeaseReel) {
            this.showAnticipation(r);
            if (this._fsm && this._fsm.canTransitionTo(SlotState.ANTICIPATION)) {
              this._fsm.transitionTo(SlotState.ANTICIPATION);
            }
          } else if (r === 0) {
            // First reel initiates stopping phase -> transition FSM to STOPPING
            if (this._fsm && this._fsm.canTransitionTo(SlotState.STOPPING)) {
              this._fsm.transitionTo(SlotState.STOPPING);
            }
          }

          this._reels[r].stopAt(
            targetStop,
            isTeaseReel,
            () => {
              this.hideAnticipation(r);
              if (isTeaseReel && this._fsm && this._fsm.canTransitionTo(SlotState.STOPPING)) {
                this._fsm.transitionTo(SlotState.STOPPING);
              }
              const hasScatter = spinResult.grid[r].includes(SymbolId.SCATTER);
              this._soundSystem?.playReelStop(1 + r * 0.35, hasScatter);
              resolve();
            },
            isFreeSpins
          );
        });
        this._delayedCalls.push(call);
      });

      stopPromises.push(reelPromise);
    }

    // Wait until all 5 reels have elastic bounce landed
    await Promise.all(stopPromises);

    // 4. Highlight winning ways if any
    if (spinResult.winningWays.length > 0) {
      this.highlightWinningWays(spinResult.winningWays);
    }

    // 5. Detect landed Wild (Kendi) symbols and feed Fu Pot with curved Bezier coins
    const offsetX = 30;
    const offsetY = 100;
    const wildPositions: { x: number; y: number }[] = [];

    for (let r = 0; r < REEL_COUNT; r++) {
      for (let row = 0; row < VISIBLE_ROWS; row++) {
        if (spinResult.grid[r][row] === SymbolId.WILD) {
          wildPositions.push({
            x: offsetX + r * REEL_WIDTH + REEL_WIDTH / 2,
            y: offsetY + row * CELL_HEIGHT + CELL_HEIGHT / 2,
          });
        }
      }
    }

    let isJackpotTriggered = false;

    if (wildPositions.length > 0) {
      for (const pos of wildPositions) {
        this._soundSystem?.playWildBezier();
        const triggered = await this.fuPot.feedWild(pos, this.particleManager);
        if (triggered) {
          this._soundSystem?.playJackpotTrigger();
          isJackpotTriggered = true;
        }
      }
    }

    return { isJackpotTriggered };
  }

  /**
   * Highlights all symbols participating in winning combinations with golden glow.
   */
  public highlightWinningWays(winningWays: WinWay[]): void {
    this.clearWins();

    for (const way of winningWays) {
      for (const pos of way.winningPositions) {
        const reel = this._reels[pos.reel];
        if (reel) {
          reel.highlightRow(pos.row);
        }
      }
    }
  }

  /**
   * Clears highlights across all 5 reels.
   */
  public clearWins(): void {
    for (const reel of this._reels) {
      reel.clearHighlights();
    }
  }

  /**
   * Activates flashing anticipation frame on specific reel.
   */
  private showAnticipation(reelIndex: number): void {
    const frame = this._anticipationFrames[reelIndex];
    if (frame) {
      frame.visible = true;
      gsap.killTweensOf(frame);
      gsap.to(frame, {
        alpha: 0.3,
        duration: 0.25,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }

  /**
   * Hides anticipation frame on specific reel.
   */
  private hideAnticipation(reelIndex: number): void {
    const frame = this._anticipationFrames[reelIndex];
    if (frame) {
      gsap.killTweensOf(frame);
      frame.visible = false;
      frame.alpha = 1.0;
    }
  }

  /**
   * Hides all anticipation frames.
   */
  private hideAllAnticipations(): void {
    for (let r = 0; r < REEL_COUNT; r++) {
      this.hideAnticipation(r);
    }
  }

  /**
   * Sets visible symbols immediately across all 5 reels (used on load/restore).
   */
  public setInitialGrid(grid: SymbolId[][]): void {
    if (!grid || !Array.isArray(grid)) return;
    for (let r = 0; r < REEL_COUNT; r++) {
      if (grid[r] && this._reels[r]) {
        this._reels[r].setVisibleSymbols(grid[r]);
      }
    }
  }

  /**
   * Access individual reel by index.
   */
  public getReel(index: number): Reel | undefined {
    return this._reels[index];
  }

  /**
   * Clean destruction of Pixi application, particles, and animations.
   */
  public destroy(): void {
    gsap.killTweensOf(this._boardContainer);
    gsap.killTweensOf(this._freeSpinsBanner);
    this.particleManager.destroy();
    this.app.destroy(true, { children: true, texture: true });
  }
}
