/**
 * SlotKita - Independent Reel Column with Dynamic Blur & GSAP Elastic Physics
 * Phase 3: WebGL Vector Graphics & GSAP Animations
 */

import { Container, BlurFilter } from 'pixi.js';
import { gsap } from 'gsap';
import { SymbolView, SYMBOL_SIZE } from './SymbolView';
import { SymbolId } from '../math/Types';
import { REEL_STRIPS, FREE_SPIN_REEL_STRIPS, VISIBLE_ROWS } from '../math/ReelStrips';

export const CELL_HEIGHT = 150;
export const TOTAL_BUFFER_SYMBOLS = 5; // 1 above, 3 visible, 1 below

export class Reel extends Container {
  public readonly reelIndex: number;
  private _symbolViews: SymbolView[] = [];
  private _blurFilter: BlurFilter;
  private _isSpinning: boolean = false;
  private _currentStripIndex: number = 0;
  private _symbolsContainer: Container;
  private _spinTimeline?: gsap.core.Timeline;

  constructor(reelIndex: number) {
    super();
    this.reelIndex = reelIndex;

    this._symbolsContainer = new Container();
    this.addChild(this._symbolsContainer);

    // Dynamic vertical blur filter (proportional to spin speed)
    this._blurFilter = new BlurFilter({
      strengthX: 0,
      strengthY: 0,
      quality: 2,
    });
    this._symbolsContainer.filters = [this._blurFilter];

    this.initSymbolPool();
  }

  public get isSpinning(): boolean {
    return this._isSpinning;
  }

  /**
   * Initializes the pool of 5 symbol views (1 buffer top, 3 visible, 1 buffer bottom).
   */
  private initSymbolPool(): void {
    const strip = REEL_STRIPS[this.reelIndex];
    this._currentStripIndex = 0;

    for (let i = 0; i < TOTAL_BUFFER_SYMBOLS; i++) {
      // Offset i - 1: i=0 is top buffer (-150px), i=1..3 are visible (0, 150, 300px), i=4 is bottom buffer (450px)
      const stripIdx = (strip.length + i - 1) % strip.length;
      const symView = new SymbolView(strip[stripIdx]);
      symView.position.set((CELL_HEIGHT - SYMBOL_SIZE) / 2, (i - 1) * CELL_HEIGHT);
      this._symbolViews.push(symView);
      this._symbolsContainer.addChild(symView);
    }
  }

  /**
   * Sets visible 3 symbols immediately (used during init or session recovery).
   */
  public setVisibleSymbols(symbols: SymbolId[]): void {
    const strip = REEL_STRIPS[this.reelIndex];
    const topBuffer = strip[Math.floor(Math.random() * strip.length)];
    const btmBuffer = strip[Math.floor(Math.random() * strip.length)];

    const allFive = [topBuffer, ...symbols, btmBuffer];

    for (let i = 0; i < TOTAL_BUFFER_SYMBOLS; i++) {
      this._symbolViews[i].setSymbol(allFive[i]);
      this._symbolViews[i].position.set(
        (CELL_HEIGHT - SYMBOL_SIZE) / 2,
        (i - 1) * CELL_HEIGHT
      );
    }
  }

  /**
   * Begins spinning this reel with initial pullback anticipation.
   */
  public startSpin(isFreeSpins: boolean = false): void {
    if (this._isSpinning) return;
    this._isSpinning = true;
    this.clearHighlights();

    if (this._spinTimeline) {
      this._spinTimeline.kill();
      this._spinTimeline = undefined;
    }
    gsap.killTweensOf(this._symbolsContainer.position);

    const strip = isFreeSpins ? FREE_SPIN_REEL_STRIPS[this.reelIndex] : REEL_STRIPS[this.reelIndex];
    const tl = gsap.timeline();
    this._spinTimeline = tl;

    // 1. Snappy pullback anticipation (-24px upwards)
    tl.to(this._symbolsContainer.position, {
      y: -24,
      duration: 0.14,
      ease: 'power1.out',
    });

    // 2. Return to origin and ramp up vertical blur
    tl.to(this._symbolsContainer.position, {
      y: 0,
      duration: 0.08,
      ease: 'none',
      onStart: () => {
        gsap.to(this._blurFilter, { strengthY: 18, duration: 0.18 });
      },
    });

    // Continuous ticker-driven symbol scrolling while spinning
    const spinSpeed = 28; // px per tick
    const updateScroll = () => {
      if (!this._isSpinning) {
        gsap.ticker.remove(updateScroll);
        return;
      }

      for (let i = 0; i < TOTAL_BUFFER_SYMBOLS; i++) {
        const view = this._symbolViews[i];
        view.y += spinSpeed;

        // Wrap around bottom to top
        if (view.y >= (TOTAL_BUFFER_SYMBOLS - 1) * CELL_HEIGHT) {
          view.y -= TOTAL_BUFFER_SYMBOLS * CELL_HEIGHT;
          // Fetch next symbol from virtual strip
          this._currentStripIndex = (this._currentStripIndex + 1) % strip.length;
          view.setSymbol(strip[this._currentStripIndex]);
        }
      }
    };

    gsap.ticker.add(updateScroll);
  }

  /**
   * Decelerates and lands smoothly on target stop index with elastic bounce-back.
   *
   * @param targetStop Target stop index on the virtual reel strip
   * @param isAnticipation If true, prolongs spin with heightened anticipation
   * @param onComplete Callback invoked when reel has completely stopped
   * @param isFreeSpins If true, lands symbols from enriched free spin strips
   */
  public stopAt(
    targetStop: number,
    isAnticipation: boolean = false,
    onComplete?: () => void,
    isFreeSpins: boolean = false
  ): void {
    const strip = isFreeSpins ? FREE_SPIN_REEL_STRIPS[this.reelIndex] : REEL_STRIPS[this.reelIndex];
    const stripLen = strip.length;

    // Target 3 visible symbols
    const targetVisible: SymbolId[] = [
      strip[targetStop % stripLen],
      strip[(targetStop + 1) % stripLen],
      strip[(targetStop + 2) % stripLen],
    ];

    const topBuffer = strip[(targetStop + stripLen - 1) % stripLen];
    const btmBuffer = strip[(targetStop + 3) % stripLen];
    const finalFive = [topBuffer, ...targetVisible, btmBuffer];

    // Kill any active spin timeline or tweens on container
    if (this._spinTimeline) {
      this._spinTimeline.kill();
      this._spinTimeline = undefined;
    }
    gsap.killTweensOf(this._symbolsContainer.position);

    // Stop continuous scrolling ticker
    this._isSpinning = false;

    // Precisely reset all 5 symbol views into standard rows with target symbols
    for (let i = 0; i < TOTAL_BUFFER_SYMBOLS; i++) {
      this._symbolViews[i].setSymbol(finalFive[i]);
      this._symbolViews[i].position.set(
        (CELL_HEIGHT - SYMBOL_SIZE) / 2,
        (i - 1) * CELL_HEIGHT
      );
    }

    // Start symbol container with deceleration dive from slightly above
    this._symbolsContainer.position.y = -CELL_HEIGHT * 0.6;

    // Overshoot slightly past resting point
    const overshootY = 20;

    gsap.to(this._symbolsContainer.position, {
      y: overshootY,
      duration: isAnticipation ? 0.32 : 0.22,
      ease: 'power2.in',
      onComplete: () => {
        // Snap back with elastic bounce
        gsap.to(this._symbolsContainer.position, {
          y: 0,
          duration: 0.28,
          ease: 'back.out(2.4)',
          onStart: () => {
            // Rapidly remove blur filter during snap back
            gsap.to(this._blurFilter, { strengthY: 0, duration: 0.12 });
          },
          onComplete: () => {
            this._symbolsContainer.position.y = 0;

            // Pulse landing effect on visible symbols
            for (let i = 1; i <= VISIBLE_ROWS; i++) {
              this._symbolViews[i].playPulse();
            }

            if (onComplete) {
              onComplete();
            }
          },
        });
      },
    });
  }

  /**
   * Highlights a specific row (0, 1, or 2) with win glow.
   */
  public highlightRow(row: number): void {
    const symbolView = this._symbolViews[row + 1]; // +1 offset for top buffer
    if (symbolView) {
      symbolView.playWinGlow();
    }
  }

  /**
   * Clears highlights from all symbols in this reel.
   */
  public clearHighlights(): void {
    for (const view of this._symbolViews) {
      view.stopAnimation();
    }
  }

  /**
   * Returns symbol view at visible row (0 to 2).
   */
  public getVisibleSymbolView(row: number): SymbolView | undefined {
    return this._symbolViews[row + 1];
  }
}
