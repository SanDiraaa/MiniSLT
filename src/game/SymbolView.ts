/**
 * SlotKita - High-Resolution Procedural Vector Symbol Renderer
 * Phase 3: WebGL Vector Graphics & GSAP Animations
 * 100% Procedural rendering via PixiJS v8 - No external image files required.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { SymbolId } from '../math/Types';
import { SYMBOL_CONFIGS } from '../math/Paytable';

export const SYMBOL_SIZE = 140;

export class SymbolView extends Container {
  public symbolId: SymbolId;
  private _baseGraphic: Graphics;
  private _contentContainer: Container;
  private _glowGraphic: Graphics;
  private _labelText?: Text;
  private _activeTween?: gsap.core.Tween;
  private _glowTween?: gsap.core.Tween;

  constructor(symbolId: SymbolId) {
    super();
    this.symbolId = symbolId;

    // Enable hit area / bounds
    this.width = SYMBOL_SIZE;
    this.height = SYMBOL_SIZE;

    // Sub-containers for layering
    this._glowGraphic = new Graphics();
    this._baseGraphic = new Graphics();
    this._contentContainer = new Container();

    this.addChild(this._glowGraphic);
    this.addChild(this._baseGraphic);
    this.addChild(this._contentContainer);

    this.renderProceduralGraphic();
  }

  /**
   * Updates the symbol displayed by this view.
   */
  public setSymbol(newSymbolId: SymbolId): void {
    if (this.symbolId === newSymbolId) return;
    this.symbolId = newSymbolId;
    this.stopAnimation();
    this.renderProceduralGraphic();
  }

  /**
   * Main vector graphics generator for each oriental symbol.
   */
  private renderProceduralGraphic(): void {
    this._glowGraphic.clear();
    this._baseGraphic.clear();
    this._contentContainer.removeChildren();

    const cx = SYMBOL_SIZE / 2;
    const cy = SYMBOL_SIZE / 2;

    // Background tile with beveled gold border & rich gradient tone
    this.renderTilePlate();

    switch (this.symbolId) {
      // 1. High Pay: Koin Emas Kuno (Ancient Chinese Coin)
      case SymbolId.COIN:
        this.renderAncientCoin(cx, cy);
        break;

      // 2. High Pay: Burung Phoenix Emas (Golden Phoenix)
      case SymbolId.BIRD:
        this.renderGoldenPhoenix(cx, cy);
        break;

      // 3. High Pay: Kapal Layar Naga (Dragon Ship / Junk)
      case SymbolId.SHIP:
        this.renderDragonShip(cx, cy);
        break;

      // 4. High Pay: Kura-kura Giok Emas (Golden Jade Tortoise)
      case SymbolId.TORTOISE:
        this.renderJadeTortoise(cx, cy);
        break;

      // 5. Special: Wild (Kendi Emas / Batang Giok Berkilau)
      case SymbolId.WILD:
        this.renderGoldenUrnWild(cx, cy);
        break;

      // 6. Special: Scatter (Gong Emas bertuliskan "福" Fu)
      case SymbolId.SCATTER:
        this.renderGoldenGongScatter(cx, cy);
        break;

      // 7. Low Pay: Royals (A, K, Q, J, 10, 9)
      default:
        this.renderRoyals(cx, cy);
        break;
    }
  }

  /**
   * Renders the luxurious lacquered oriental tile plate.
   */
  private renderTilePlate(): void {
    const margin = 4;
    const size = SYMBOL_SIZE - margin * 2;
    const radius = 16;

    // Outer dark crimson/lacquer tile
    this._baseGraphic
      .roundRect(margin, margin, size, size, radius)
      .fill({ color: 0x1a060a, alpha: 0.85 })
      .stroke({ color: 0x6e1b24, width: 2, alpha: 0.9 });

    // Inner subtle gold filigree rim
    this._baseGraphic
      .roundRect(margin + 3, margin + 3, size - 6, size - 6, radius - 2)
      .stroke({ color: 0xd4af37, width: 1.5, alpha: 0.6 });

    // Corner decorative accents
    const cornerSize = 8;
    this._baseGraphic
      .rect(margin + 4, margin + 4, cornerSize, 2).fill(0xffd700)
      .rect(margin + 4, margin + 4, 2, cornerSize).fill(0xffd700)
      .rect(margin + size - cornerSize - 4, margin + 4, cornerSize, 2).fill(0xffd700)
      .rect(margin + size - 6, margin + 4, 2, cornerSize).fill(0xffd700)
      .rect(margin + 4, margin + size - 6, cornerSize, 2).fill(0xffd700)
      .rect(margin + 4, margin + size - cornerSize - 4, 2, cornerSize).fill(0xffd700)
      .rect(margin + size - cornerSize - 4, margin + size - 6, cornerSize, 2).fill(0xffd700)
      .rect(margin + size - 6, margin + size - cornerSize - 4, 2, cornerSize).fill(0xffd700);
  }

  /**
   * High Pay: Koin Emas Kuno (Ancient Gold Coin)
   */
  private renderAncientCoin(cx: number, cy: number): void {
    const g = new Graphics();
    const r = 44;

    // Outer drop shadow
    g.circle(cx + 2, cy + 4, r).fill({ color: 0x000000, alpha: 0.5 });

    // Outer coin disc (Gold base)
    g.circle(cx, cy, r).fill(0xd4af37).stroke({ color: 0xfff099, width: 3 });

    // Inner bevel ridge
    g.circle(cx, cy, r - 5).stroke({ color: 0x996515, width: 2, alpha: 0.8 });

    // Central square hole (Chinese coin hallmark)
    const sq = 22;
    g.rect(cx - sq / 2, cy - sq / 2, sq, sq)
      .fill(0x1a060a)
      .stroke({ color: 0x996515, width: 2.5 });

    // Four ancient decorative dots/dots for four directions
    g.circle(cx, cy - 26, 3).fill(0xffffff)
      .circle(cx, cy + 26, 3).fill(0xffffff)
      .circle(cx - 26, cy, 3).fill(0xffffff)
      .circle(cx + 26, cy, 3).fill(0xffffff);

    this._contentContainer.addChild(g);

    // Embossed Chinese characters "招財" (Bring Wealth)
    const style = new TextStyle({
      fontFamily: 'serif, SimSun, Arial',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0xfff6c2,
      dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 2, color: 0x553300, distance: 1 },
    });

    const topTxt = new Text({ text: '招', style });
    topTxt.anchor.set(0.5);
    topTxt.position.set(cx, cy - 25);

    const btmTxt = new Text({ text: '財', style });
    btmTxt.anchor.set(0.5);
    btmTxt.position.set(cx, cy + 25);

    const leftTxt = new Text({ text: '進', style });
    leftTxt.anchor.set(0.5);
    leftTxt.position.set(cx - 25, cy);

    const rightTxt = new Text({ text: '寶', style });
    rightTxt.anchor.set(0.5);
    rightTxt.position.set(cx + 25, cy);

    this._contentContainer.addChild(topTxt, btmTxt, leftTxt, rightTxt);
  }

  /**
   * High Pay: Burung Phoenix Emas (Golden Phoenix)
   */
  private renderGoldenPhoenix(cx: number, cy: number): void {
    const g = new Graphics();

    // Phoenix fiery glow backdrop
    g.circle(cx, cy, 42).fill({ color: 0xdc143c, alpha: 0.25 });

    // Outspread wings (Gold & Ruby layers)
    // Left Wing
    g.poly([
      cx - 4, cy + 8,
      cx - 24, cy - 12,
      cx - 42, cy - 30,
      cx - 32, cy - 8,
      cx - 40, cy + 10,
      cx - 26, cy + 18,
      cx - 8, cy + 20,
    ]).fill(0xffaa00).stroke({ color: 0xffd700, width: 2 });

    // Right Wing
    g.poly([
      cx + 4, cy + 8,
      cx + 24, cy - 12,
      cx + 42, cy - 30,
      cx + 32, cy - 8,
      cx + 40, cy + 10,
      cx + 26, cy + 18,
      cx + 8, cy + 20,
    ]).fill(0xffaa00).stroke({ color: 0xffd700, width: 2 });

    // Phoenix Body (Ruby red center)
    g.ellipse(cx, cy + 6, 12, 22).fill(0xcc1122).stroke({ color: 0xffd700, width: 2 });

    // Phoenix Head & Golden Crest
    g.circle(cx, cy - 16, 9).fill(0xffd700).stroke({ color: 0xff8800, width: 1.5 });
    g.poly([cx, cy - 25, cx - 7, cy - 36, cx, cy - 30, cx + 7, cy - 36]).fill(0xff2244); // Crown

    // Golden Beak
    g.poly([cx, cy - 18, cx - 2, cy - 13, cx + 2, cy - 13]).fill(0xffaa00);

    // Flowing Tail Feathers
    g.poly([cx - 3, cy + 24, cx - 12, cy + 44, cx, cy + 38, cx + 12, cy + 44, cx + 3, cy + 24]).fill(0xff4422);

    this._contentContainer.addChild(g);
  }

  /**
   * High Pay: Kapal Naga Emas (Dragon Ship / Junk)
   */
  private renderDragonShip(cx: number, cy: number): void {
    const g = new Graphics();

    // Ocean crest waves backdrop
    g.ellipse(cx, cy + 30, 42, 10).fill({ color: 0x005577, alpha: 0.4 });

    // Ship Hull (Golden Dragon Vessel)
    g.poly([
      cx - 40, cy + 10, // Bow
      cx - 30, cy + 26,
      cx + 30, cy + 26,
      cx + 42, cy + 12, // Stern
      cx + 30, cy + 14,
      cx - 30, cy + 14,
    ]).fill(0xd4af37).stroke({ color: 0xfff099, width: 2 });

    // Dragon head figurehead on bow
    g.circle(cx - 38, cy + 6, 6).fill(0xff2222);
    g.rect(cx - 44, cy + 5, 6, 3).fill(0xffd700);

    // Main Mast
    g.rect(cx - 2, cy - 36, 4, 48).fill(0x8b4513);

    // Dragon Sails (Ribbed oriental sails, Crimson & Gold)
    g.poly([
      cx - 1, cy - 34,
      cx + 32, cy - 22,
      cx + 26, cy + 8,
      cx - 1, cy + 10,
    ]).fill(0xdc143c).stroke({ color: 0xffd700, width: 1.5 });

    // Sail Ribs
    g.rect(cx, cy - 20, 26, 1.5).fill(0xffd700);
    g.rect(cx, cy - 6, 28, 1.5).fill(0xffd700);

    // Forward Jib Sail
    g.poly([
      cx - 2, cy - 28,
      cx - 24, cy - 8,
      cx - 2, cy + 8,
    ]).fill(0xcc1122).stroke({ color: 0xffd700, width: 1 });

    // Golden Water ripples at base
    g.ellipse(cx, cy + 32, 28, 3).fill(0x00a8cc);

    this._contentContainer.addChild(g);
  }

  /**
   * High Pay: Kura-kura Giok Emas (Golden Jade Tortoise)
   */
  private renderJadeTortoise(cx: number, cy: number): void {
    const g = new Graphics();

    // Golden Feet & Head (Extending from shell)
    g.circle(cx, cy - 28, 9).fill(0xffd700).stroke({ color: 0x996515, width: 1.5 }); // Head
    g.circle(cx - 26, cy - 16, 8).fill(0xffd700); // Front Left
    g.circle(cx + 26, cy - 16, 8).fill(0xffd700); // Front Right
    g.circle(cx - 24, cy + 20, 8).fill(0xffd700); // Back Left
    g.circle(cx + 24, cy + 20, 8).fill(0xffd700); // Back Right
    g.poly([cx - 3, cy + 30, cx, cy + 36, cx + 3, cy + 30]).fill(0xffd700); // Tail

    // Main Jade Shell (Deep Emerald Green)
    g.ellipse(cx, cy + 2, 28, 32)
      .fill(0x008050)
      .stroke({ color: 0xffd700, width: 3 });

    // Inner Hexagonal Jade Pattern (Embossed Gold lines)
    g.poly([
      cx, cy - 18,
      cx + 12, cy - 10,
      cx + 12, cy + 10,
      cx, cy + 18,
      cx - 12, cy + 10,
      cx - 12, cy - 10,
    ]).fill(0x00a86b).stroke({ color: 0xffe066, width: 2 });

    // Center Shell Gem
    g.circle(cx, cy, 6).fill(0xffd700).stroke({ color: 0xffffff, width: 1 });

    this._contentContainer.addChild(g);
  }

  /**
   * Special: Wild - Kendi Emas Berkilau / Batang Giok Naga
   */
  private renderGoldenUrnWild(cx: number, cy: number): void {
    const g = new Graphics();

    // Aura ring of wild energy
    g.circle(cx, cy - 4, 45).fill({ color: 0x00a86b, alpha: 0.25 });

    // Golden Treasure Urn / Pot of Wealth
    g.poly([
      cx - 18, cy - 20, // Rim
      cx + 18, cy - 20,
      cx + 26, cy + 4,  // Bulging belly
      cx + 18, cy + 22, // Base
      cx - 18, cy + 22,
      cx - 26, cy + 4,
    ]).fill(0xd4af37).stroke({ color: 0xfff3a8, width: 2.5 });

    // Jade Gem Medallion in center of Urn
    g.circle(cx, cy + 2, 12).fill(0x00a86b).stroke({ color: 0xffffff, width: 1.5 });
    g.circle(cx, cy + 2, 5).fill(0xffd700);

    // Overflowing Golden Ingot (Yuanbao) top
    g.poly([
      cx - 15, cy - 20,
      cx - 20, cy - 28,
      cx + 20, cy - 28,
      cx + 15, cy - 20,
    ]).fill(0xffd700).stroke({ color: 0xffaa00, width: 1.5 });
    g.circle(cx, cy - 28, 7).fill(0xffea70);

    this._contentContainer.addChild(g);

    // Bold "WILD" Ribbon Banner across bottom
    const banner = new Graphics();
    banner.roundRect(cx - 42, cy + 18, 84, 22, 6)
      .fill(0x8b0000)
      .stroke({ color: 0xffd700, width: 2 });
    this._contentContainer.addChild(banner);

    const wildStyle = new TextStyle({
      fontFamily: 'Impact, sans-serif',
      fontSize: 14,
      fontWeight: '900',
      fill: 0xfff2a3,
      letterSpacing: 2,
      dropShadow: { alpha: 0.9, angle: Math.PI / 4, blur: 2, color: 0x000000, distance: 1.5 },
    });

    const wildText = new Text({ text: 'WILD', style: wildStyle });
    wildText.anchor.set(0.5);
    wildText.position.set(cx, cy + 29);
    this._contentContainer.addChild(wildText);
  }

  /**
   * Special: Scatter - Gong Emas bertuliskan "福" (Fu - Fortune)
   */
  private renderGoldenGongScatter(cx: number, cy: number): void {
    const g = new Graphics();
    const r = 40;

    // Sacred Gong Hanging Rope / Frame
    g.rect(cx - 36, cy - 44, 72, 4).fill(0x5a1827); // Crossbeam
    g.poly([cx - 24, cy - 42, cx - 24, cy - 26]).stroke({ color: 0xdc143c, width: 2.5 }); // Left cord
    g.poly([cx + 24, cy - 42, cx + 24, cy - 26]).stroke({ color: 0xdc143c, width: 2.5 }); // Right cord

    // Main Gong Disc (Bronze Gold with heavy bevel)
    g.circle(cx, cy - 2, r)
      .fill(0xc59b27)
      .stroke({ color: 0xfff099, width: 3.5 });

    // Inner embossed circle ring
    g.circle(cx, cy - 2, r - 7).stroke({ color: 0x7c5700, width: 2, alpha: 0.9 });
    g.circle(cx, cy - 2, r - 12).fill({ color: 0xdc143c, alpha: 0.85 }); // Red lacquer inner circle

    this._contentContainer.addChild(g);

    // Calligraphy Character "福" (Fu - Prosperity)
    const fuStyle = new TextStyle({
      fontFamily: 'serif, SimSun, KaiTi, Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0xffea88,
      dropShadow: { alpha: 0.9, angle: Math.PI / 4, blur: 3, color: 0x4a0000, distance: 2 },
    });

    const fuText = new Text({ text: '福', style: fuStyle });
    fuText.anchor.set(0.5);
    fuText.position.set(cx, cy - 3);
    this._contentContainer.addChild(fuText);

    // SCATTER Bottom Ribbon
    const banner = new Graphics();
    banner.roundRect(cx - 46, cy + 22, 92, 18, 5)
      .fill(0x4a0e17)
      .stroke({ color: 0xffd700, width: 1.5 });
    this._contentContainer.addChild(banner);

    const scatterStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      fontWeight: '900',
      fill: 0xfff3a8,
      letterSpacing: 2,
    });

    const scatterText = new Text({ text: 'SCATTER', style: scatterStyle });
    scatterText.anchor.set(0.5);
    scatterText.position.set(cx, cy + 31);
    this._contentContainer.addChild(scatterText);
  }

  /**
   * Low Pay: Royals (A, K, Q, J, 10, 9) with ornate oriental typography
   */
  private renderRoyals(cx: number, cy: number): void {
    const config = SYMBOL_CONFIGS[this.symbolId];
    const letter = config.name;

    // Distinct theme colors per card rank
    let primaryColor = 0xffd700;
    let secondaryColor = 0x8b0000;

    switch (this.symbolId) {
      case SymbolId.ACE:
        primaryColor = 0xff4d4d;
        secondaryColor = 0x800000;
        break;
      case SymbolId.KING:
        primaryColor = 0xffaa00;
        secondaryColor = 0x995500;
        break;
      case SymbolId.QUEEN:
        primaryColor = 0xe066ff;
        secondaryColor = 0x660066;
        break;
      case SymbolId.JACK:
        primaryColor = 0x33ccff;
        secondaryColor = 0x004466;
        break;
      case SymbolId.TEN:
        primaryColor = 0x55ee99;
        secondaryColor = 0x005522;
        break;
      case SymbolId.NINE:
        primaryColor = 0xcccccc;
        secondaryColor = 0x444444;
        break;
    }

    const g = new Graphics();

    // Ornate oriental background pattern disc
    g.circle(cx, cy, 38).fill({ color: secondaryColor, alpha: 0.35 }).stroke({ color: primaryColor, width: 1.5, alpha: 0.5 });
    g.circle(cx, cy, 32).stroke({ color: 0xffd700, width: 1, alpha: 0.3 });

    this._contentContainer.addChild(g);

    // Calligraphic embossed royal text
    const royalStyle = new TextStyle({
      fontFamily: 'serif, Georgia, SimSun, Arial',
      fontSize: letter.length > 1 ? 40 : 46,
      fontWeight: '900',
      fill: [primaryColor, 0xffffff, 0xffd700],
      stroke: { color: 0x110000, width: 3 },
      dropShadow: { alpha: 0.85, angle: Math.PI / 4, blur: 4, color: 0x000000, distance: 3 },
    });

    this._labelText = new Text({ text: letter, style: royalStyle });
    this._labelText.anchor.set(0.5);
    this._labelText.position.set(cx, cy);

    this._contentContainer.addChild(this._labelText);
  }

  // ==========================================
  // Visual Animation Methods (GSAP powered)
  // ==========================================

  /**
   * Subtle breathing idle loop for visual immersion.
   */
  public playIdleBreathing(): void {
    this.stopAnimation();

    this._activeTween = gsap.to(this.scale, {
      x: 1.03,
      y: 1.03,
      duration: 1.2 + Math.random() * 0.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  /**
   * Intense win celebration glow with bouncing pulse and golden aura.
   */
  public playWinGlow(): void {
    this.stopAnimation();

    const cx = SYMBOL_SIZE / 2;
    const cy = SYMBOL_SIZE / 2;

    // Draw glowing pulsing halo
    this._glowGraphic
      .circle(cx, cy, 58)
      .fill({ color: 0xffd700, alpha: 0.45 })
      .stroke({ color: 0xffffff, width: 3, alpha: 0.8 });

    this._glowTween = gsap.to(this._glowGraphic, {
      alpha: 0.2,
      duration: 0.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    this._activeTween = gsap.to(this.scale, {
      x: 1.12,
      y: 1.12,
      duration: 0.4,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  }

  /**
   * Punchy single pulse effect (used on landing / anticipation stop).
   */
  public playPulse(): void {
    gsap.killTweensOf(this.scale);
    gsap.fromTo(
      this.scale,
      { x: 1.15, y: 1.15 },
      { x: 1.0, y: 1.0, duration: 0.35, ease: 'back.out(2)' }
    );
  }

  /**
   * Resets all animations and restores original scale & alpha.
   */
  public stopAnimation(): void {
    if (this._activeTween) {
      this._activeTween.kill();
      this._activeTween = undefined;
    }
    if (this._glowTween) {
      this._glowTween.kill();
      this._glowTween = undefined;
    }

    this._glowGraphic.clear();
    this.scale.set(1.0);
    this.alpha = 1.0;
    this.rotation = 0;
  }
}
