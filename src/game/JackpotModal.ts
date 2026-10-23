/**
 * SlotKita - 12 Face-Down Coins Jackpot Bonus Mini-Game
 * Phase 4: DuoFuDuoCai 12 Coins Interactive Bonus Screen & 3-Match Resolution
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { ParticleManager } from './ParticleManager';
import { GameStateStore } from '../core/GameState';
import { SoundSystem } from '../core/SoundSystem';

export enum JackpotTier {
  MINI = 'MINI',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  GRAND = 'GRAND',
}

export interface JackpotConfig {
  tier: JackpotTier;
  title: string;
  multiplier: number; // Multiplier of total bet
  color: number;
  textColor: string;
  icon: string;
}

export const JACKPOT_CONFIGS: Record<JackpotTier, JackpotConfig> = {
  [JackpotTier.GRAND]: {
    tier: JackpotTier.GRAND,
    title: 'GRAND JACKPOT',
    multiplier: 1000, // 1000x total bet (e.g. 100jt pada bet 100k)
    color: 0xdc143c,
    textColor: '#ff4d4d',
    icon: '🐉',
  },
  [JackpotTier.MAJOR]: {
    tier: JackpotTier.MAJOR,
    title: 'MAJOR JACKPOT',
    multiplier: 200,  // 200x total bet (e.g. 20jt)
    color: 0x1e90ff,
    textColor: '#33ccff',
    icon: '🦚',
  },
  [JackpotTier.MINOR]: {
    tier: JackpotTier.MINOR,
    title: 'MINOR JACKPOT',
    multiplier: 50,   // 50x total bet (e.g. 5jt)
    color: 0x00a86b,
    textColor: '#00ff88',
    icon: '🐯',
  },
  [JackpotTier.MINI]: {
    tier: JackpotTier.MINI,
    title: 'MINI JACKPOT',
    multiplier: 20,   // 20x total bet (e.g. 2jt)
    color: 0xcd7f32,
    textColor: '#ffaa44',
    icon: '🐢',
  },
};

interface CoinData {
  tier: JackpotTier;
  revealed: boolean;
  container: Container;
  frontFace: Container;
  backFace: Container;
}

export class JackpotModal extends Container {
  private _backdrop: Graphics;
  private _modalBox: Container;
  private _coins: CoinData[] = [];
  private _counts: Record<JackpotTier, number> = {
    [JackpotTier.MINI]: 0,
    [JackpotTier.MINOR]: 0,
    [JackpotTier.MAJOR]: 0,
    [JackpotTier.GRAND]: 0,
  };
  private _trackerIcons: Record<JackpotTier, Graphics[]> = {
    [JackpotTier.MINI]: [],
    [JackpotTier.MINOR]: [],
    [JackpotTier.MAJOR]: [],
    [JackpotTier.GRAND]: [],
  };
  private _trackerValueTexts: Record<JackpotTier, Text> = {} as any;
  private _isGameOver: boolean = false;
  private _particleManager: ParticleManager;
  private _stateStore: GameStateStore;
  private _soundSystem?: SoundSystem;
  private _onCompleteCallback?: (wonTier: JackpotTier, winAmount: number) => void;

  constructor(particleManager: ParticleManager, stateStore: GameStateStore, soundSystem?: SoundSystem) {
    super();
    this._particleManager = particleManager;
    this._stateStore = stateStore;
    this._soundSystem = soundSystem;

    this.visible = false;

    // Dark blurred backdrop overlay
    this._backdrop = new Graphics();
    this.addChild(this._backdrop);

    this._modalBox = new Container();
    this.addChild(this._modalBox);
  }

  /**
   * Opens and starts the 12-Coin Jackpot Mini-Game.
   */
  public open(onComplete: (wonTier: JackpotTier, winAmount: number) => void): void {
    this._onCompleteCallback = onComplete;
    this._isGameOver = false;
    this._counts = {
      [JackpotTier.MINI]: 0,
      [JackpotTier.MINOR]: 0,
      [JackpotTier.MAJOR]: 0,
      [JackpotTier.GRAND]: 0,
    };

    this.visible = true;
    this.alpha = 0;

    this.renderModal();

    gsap.to(this, { alpha: 1, duration: 0.4, ease: 'power2.out' });
  }

  /**
   * Constructs the modal layout: Jackpot Meters at top, 4x3 Coins grid in center.
   */
  private renderModal(): void {
    const screenWidth = 830;
    const screenHeight = 580;

    // 1. Semi-transparent backdrop
    this._backdrop.clear();
    this._backdrop
      .rect(0, 0, screenWidth, screenHeight)
      .fill({ color: 0x050204, alpha: 0.92 });

    this._modalBox.removeChildren();

    // 2. Modal Pavilion Outer Frame
    const boxBg = new Graphics();
    boxBg
      .roundRect(40, 20, screenWidth - 80, screenHeight - 40, 20)
      .fill({ color: 0x1f060c, alpha: 0.98 })
      .stroke({ color: 0xd4af37, width: 4 });

    // Inner filigree
    boxBg
      .roundRect(46, 26, screenWidth - 92, screenHeight - 52, 16)
      .stroke({ color: 0xffd700, width: 1.5, alpha: 0.5 });

    this._modalBox.addChild(boxBg);

    // 3. Header Banner "BONUS 12 KOIN DEWA KEBERUNTUNGAN"
    const titleStyle = new TextStyle({
      fontFamily: 'Impact, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: [0xfff099, 0xffd700, 0xffa500],
      dropShadow: { alpha: 0.9, angle: Math.PI / 4, blur: 4, color: 0x000000, distance: 2 },
    });
    const headerText = new Text({ text: '🎰 MINI-GAME JACKPOT: KUMPULKAN 3 KOIN SEJENIS 🎰', style: titleStyle });
    headerText.anchor.set(0.5, 0);
    headerText.position.set(screenWidth / 2, 32);
    this._modalBox.addChild(headerText);

    // 4. Four Jackpot Tracker Meters
    this.renderJackpotMeters(screenWidth / 2, 65);

    // 5. 12 Face-Down Coins (4 cols x 3 rows)
    this.renderCoinGrid(screenWidth / 2, 140);
  }

  /**
   * Renders the 4 Jackpot Prize Trackers (Grand, Major, Minor, Mini) with 3 indicator slots each.
   */
  private renderJackpotMeters(centerX: number, topY: number): void {
    const tiers = [JackpotTier.GRAND, JackpotTier.MAJOR, JackpotTier.MINOR, JackpotTier.MINI];
    const meterWidth = 175;
    const spacing = 185;
    const startX = centerX - (tiers.length * spacing) / 2 + meterWidth / 2;
    const currentBet = this._stateStore.getState().currentBet;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const cfg = JACKPOT_CONFIGS[tier];
      const meterX = startX + i * spacing;

      const meterBox = new Container();
      meterBox.position.set(meterX, topY);

      const bg = new Graphics();
      bg.roundRect(-meterWidth / 2, 0, meterWidth, 52, 10)
        .fill({ color: 0x110306, alpha: 0.85 })
        .stroke({ color: cfg.color, width: 2 });
      meterBox.addChild(bg);

      // Tier Title
      const tStyle = new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
        fontWeight: '900',
        fill: cfg.color,
      });
      const tText = new Text({ text: cfg.title, style: tStyle });
      tText.anchor.set(0.5, 0);
      tText.position.set(0, 4);
      meterBox.addChild(tText);

      // Prize Amount Text
      const prizeAmount = cfg.multiplier * currentBet;
      const vStyle = new TextStyle({
        fontFamily: 'monospace, Arial',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0xffffff,
      });
      const vText = new Text({ text: `${prizeAmount.toLocaleString()} Koin`, style: vStyle });
      vText.anchor.set(0.5, 0);
      vText.position.set(0, 18);
      meterBox.addChild(vText);
      this._trackerValueTexts[tier] = vText;

      // 3 Collection Slots [ ][ ][ ]
      this._trackerIcons[tier] = [];
      const slotSpacing = 16;
      for (let s = 0; s < 3; s++) {
        const slotDot = new Graphics();
        slotDot.circle((s - 1) * slotSpacing, 40, 5)
          .fill({ color: 0x222222 })
          .stroke({ color: cfg.color, width: 1.5 });
        meterBox.addChild(slotDot);
        this._trackerIcons[tier].push(slotDot);
      }

      this._modalBox.addChild(meterBox);
    }
  }

  /**
   * Generates and shuffles the 12 Coins: 3 Grand, 3 Major, 3 Minor, 3 Mini.
   */
  private renderCoinGrid(centerX: number, startY: number): void {
    this._coins = [];

    // Create exactly 3 of each tier = 12 total
    const pool: JackpotTier[] = [
      JackpotTier.GRAND, JackpotTier.GRAND, JackpotTier.GRAND,
      JackpotTier.MAJOR, JackpotTier.MAJOR, JackpotTier.MAJOR,
      JackpotTier.MINOR, JackpotTier.MINOR, JackpotTier.MINOR,
      JackpotTier.MINI, JackpotTier.MINI, JackpotTier.MINI,
    ];

    // Fisher-Yates Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const cols = 4;
    const cellW = 160;
    const cellH = 105;
    const gridLeft = centerX - (cols * cellW) / 2 + cellW / 2;

    for (let idx = 0; idx < 12; idx++) {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const coinX = gridLeft + col * cellW;
      const coinY = startY + row * cellH + 45;
      const tier = pool[idx];

      const coinContainer = new Container();
      coinContainer.position.set(coinX, coinY);
      coinContainer.eventMode = 'static';
      coinContainer.cursor = 'pointer';

      // 1. Face-Down Back (Golden Dragon Seal)
      const backFace = this.createFaceDownCoinGraphic();
      coinContainer.addChild(backFace);

      // 2. Face-Up Front (Revealed Deity/Jackpot)
      const frontFace = this.createRevealedCoinGraphic(tier);
      frontFace.visible = false;
      coinContainer.addChild(frontFace);

      const coinData: CoinData = {
        tier,
        revealed: false,
        container: coinContainer,
        frontFace,
        backFace,
      };

      // Hover micro-animation
      coinContainer.on('pointerover', () => {
        if (!coinData.revealed && !this._isGameOver) {
          gsap.to(coinContainer.scale, { x: 1.08, y: 1.08, duration: 0.15 });
        }
      });
      coinContainer.on('pointerout', () => {
        if (!coinData.revealed && !this._isGameOver) {
          gsap.to(coinContainer.scale, { x: 1.0, y: 1.0, duration: 0.15 });
        }
      });

      // Click to Flip handler
      coinContainer.on('pointertap', () => {
        this.handleCoinClick(coinData);
      });

      this._coins.push(coinData);
      this._modalBox.addChild(coinContainer);
    }
  }

  /**
   * Face-Down Coin Graphic (Ancient Gold Dragon Emblem)
   */
  private createFaceDownCoinGraphic(): Container {
    const c = new Container();
    const g = new Graphics();
    const r = 38;

    // Drop shadow
    g.circle(2, 4, r).fill({ color: 0x000000, alpha: 0.4 });
    // Gold disc
    g.circle(0, 0, r).fill(0xd4af37).stroke({ color: 0xfff3a8, width: 3 });
    // Lacquer center
    g.circle(0, 0, r - 6).fill(0x8b0000).stroke({ color: 0xffd700, width: 1.5 });

    c.addChild(g);

    // Center Gold Dragon Pearl
    const pearl = new Graphics();
    pearl.circle(0, 0, 14).fill(0xffd700).stroke({ color: 0xffffff, width: 1.5 });
    c.addChild(pearl);

    const qStyle = new TextStyle({
      fontFamily: 'serif, SimSun, Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x8b0000,
    });
    const qText = new Text({ text: '?', style: qStyle });
    qText.anchor.set(0.5);
    c.addChild(qText);

    return c;
  }

  /**
   * Face-Up Revealed Coin Graphic showing the Jackpot God / Tier
   */
  private createRevealedCoinGraphic(tier: JackpotTier): Container {
    const cfg = JACKPOT_CONFIGS[tier];
    const c = new Container();
    const g = new Graphics();
    const r = 38;

    // Outer glow
    g.circle(0, 0, r + 4).fill({ color: cfg.color, alpha: 0.4 });
    // Disc body
    g.circle(0, 0, r).fill(cfg.color).stroke({ color: 0xffffff, width: 3 });
    // Inner rim
    g.circle(0, 0, r - 6).fill(0x0a0305).stroke({ color: 0xffd700, width: 1.5 });

    c.addChild(g);

    // Icon Emoji / Emblem
    const iconStyle = new TextStyle({
      fontSize: 26,
    });
    const iconText = new Text({ text: cfg.icon, style: iconStyle });
    iconText.anchor.set(0.5);
    iconText.position.set(0, -6);
    c.addChild(iconText);

    // Tier Label
    const lStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      fontWeight: '900',
      fill: 0xffffff,
    });
    const labelText = new Text({ text: cfg.tier, style: lStyle });
    labelText.anchor.set(0.5);
    labelText.position.set(0, 18);
    c.addChild(labelText);

    return c;
  }

  /**
   * Handles player coin selection and 3D card-flip reveal.
   */
  private handleCoinClick(coin: CoinData): void {
    if (coin.revealed || this._isGameOver) return;
    coin.revealed = true;

    // 3D Flip Animation: Scale X to 0 -> swap face -> Scale X to 1
    gsap.to(coin.container.scale, {
      x: 0,
      duration: 0.14,
      ease: 'power2.in',
      onComplete: () => {
        coin.backFace.visible = false;
        coin.frontFace.visible = true;
        this._soundSystem?.playCoinFlip();

        gsap.to(coin.container.scale, {
          x: 1,
          y: 1,
          duration: 0.22,
          ease: 'back.out(2)',
        });

        // Sparkle burst on reveal
        this._particleManager.createSparkleBurst(
          coin.container.x,
          coin.container.y,
          10,
          JACKPOT_CONFIGS[coin.tier].color
        );

        // Update Jackpot Collection Progress
        this.recordPick(coin.tier);
      },
    });
  }

  /**
   * Records pick and checks if 3 of a kind has been achieved.
   */
  private recordPick(tier: JackpotTier): void {
    this._counts[tier]++;
    const count = this._counts[tier];
    const cfg = JACKPOT_CONFIGS[tier];

    // Light up matching slot dot
    const slotDot = this._trackerIcons[tier][count - 1];
    if (slotDot) {
      slotDot.clear();
      slotDot.circle(0, 0, 7)
        .fill(cfg.color)
        .stroke({ color: 0xffffff, width: 2 });

      gsap.fromTo(
        slotDot.scale,
        { x: 1.8, y: 1.8 },
        { x: 1.0, y: 1.0, duration: 0.3, ease: 'back.out' }
      );
    }

    // Check if 3 matching tier achieved!
    if (count === 3) {
      this.declareJackpotWinner(tier);
    }
  }

  /**
   * Declares winning Jackpot tier and presents celebration declaration.
   */
  private declareJackpotWinner(wonTier: JackpotTier): void {
    this._isGameOver = true;
    const cfg = JACKPOT_CONFIGS[wonTier];
    const currentBet = this._stateStore.getState().currentBet;
    const winAmount = cfg.multiplier * currentBet;

    // Reveal all remaining unrevealed coins in dimmed mode
    for (const c of this._coins) {
      if (!c.revealed) {
        c.revealed = true;
        c.backFace.visible = false;
        c.frontFace.visible = true;
        c.container.alpha = 0.45;
      }
    }

    // Massive Coin Shower Celebration!
    this._soundSystem?.playJackpotWin();
    this._particleManager.triggerCoinShower(4.0, 4);

    // Grand Victory Banner Overlay
    const winBanner = new Container();
    winBanner.position.set(415, 290);

    const bannerBg = new Graphics();
    bannerBg
      .roundRect(-220, -90, 440, 180, 16)
      .fill({ color: 0x22050b, alpha: 0.98 })
      .stroke({ color: 0xffd700, width: 4 });
    winBanner.addChild(bannerBg);

    const titleStyle = new TextStyle({
      fontFamily: 'Impact, sans-serif',
      fontSize: 28,
      fontWeight: 'bold',
      fill: [0xfff3a8, 0xffd700, 0xff8800],
      dropShadow: { alpha: 0.9, angle: Math.PI / 4, blur: 4, color: 0x000000, distance: 2 },
    });
    const titleText = new Text({ text: `🎉 ${cfg.title}! 🎉`, style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.position.set(0, -45);
    winBanner.addChild(titleText);

    const amountStyle = new TextStyle({
      fontFamily: 'monospace, Arial',
      fontSize: 32,
      fontWeight: '900',
      fill: 0xffea00,
    });
    const amountText = new Text({ text: `+${winAmount.toLocaleString()} Koin`, style: amountStyle });
    amountText.anchor.set(0.5);
    amountText.position.set(0, 0);
    winBanner.addChild(amountText);

    // Claim Victory Button
    const claimBtn = new Container();
    claimBtn.position.set(0, 48);
    claimBtn.eventMode = 'static';
    claimBtn.cursor = 'pointer';

    const btnBg = new Graphics();
    btnBg.roundRect(-90, -18, 180, 36, 10)
      .fill(0xd4af37)
      .stroke({ color: 0xffffff, width: 2 });
    claimBtn.addChild(btnBg);

    const btnStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      fontWeight: '900',
      fill: 0x4a0e17,
    });
    const btnText = new Text({ text: 'KLAIM HADIAH', style: btnStyle });
    btnText.anchor.set(0.5);
    claimBtn.addChild(btnText);

    claimBtn.on('pointertap', () => {
      this.closeModal(wonTier, winAmount);
    });

    winBanner.addChild(claimBtn);
    this._modalBox.addChild(winBanner);

    gsap.fromTo(
      winBanner.scale,
      { x: 0.4, y: 0.4 },
      { x: 1.0, y: 1.0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }
    );
  }

  private closeModal(wonTier: JackpotTier, winAmount: number): void {
    gsap.to(this, {
      alpha: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        this.visible = false;
        if (this._onCompleteCallback) {
          this._onCompleteCallback(wonTier, winAmount);
        }
      },
    });
  }
}
