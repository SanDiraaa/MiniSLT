/**
 * SlotKita - Interactive Golden Fu Pot (Kendi Emas / 聚寶盆)
 * Phase 4: Fu Pot Progression, Squash & Stretch Physics, and Random Jackpot Trigger
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { ParticleManager } from './ParticleManager';

export enum FuPotState {
  DEFLATED = 'DEFLATED',       // Kempis (Awal/Kosong)
  NORMAL = 'NORMAL',           // Normal
  FILLING = 'FILLING',         // Berisi (Mulai Menggembung)
  OVERFLOWING = 'OVERFLOWING', // Penuh Meluap (Siap Meledak)
}

export class FuPot extends Container {
  public potState: FuPotState = FuPotState.NORMAL;
  private _coinsCollected: number = 0;
  private _potBody: Graphics;
  private _potLid: Container;
  private _overflowCoins: Graphics;
  private _auraGlow: Graphics;
  private _fuLabel: Text;
  private _mouthPosition: { x: number; y: number } = { x: 0, y: 0 };
  private _auraTween?: gsap.core.Tween;

  constructor() {
    super();

    this._auraGlow = new Graphics();
    this._overflowCoins = new Graphics();
    this._potBody = new Graphics();
    this._potLid = new Container();

    this.addChild(this._auraGlow);
    this.addChild(this._overflowCoins);
    this.addChild(this._potBody);
    this.addChild(this._potLid);

    // Calligraphy "福" seal in center of pot belly
    const fuStyle = new TextStyle({
      fontFamily: 'serif, SimSun, KaiTi, Arial',
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0xffe888,
      dropShadow: { alpha: 0.9, angle: Math.PI / 4, blur: 2, color: 0x4a0000, distance: 1.5 },
    });
    this._fuLabel = new Text({ text: '福', style: fuStyle });
    this._fuLabel.anchor.set(0.5);
    this.addChild(this._fuLabel);

    this.renderPot();
    this.setState(FuPotState.NORMAL);
  }

  /**
   * Returns stage coordinates of the pot's mouth where coins should enter.
   */
  public getMouthStagePosition(): { x: number; y: number } {
    return { x: this.x + this._mouthPosition.x, y: this.y + this._mouthPosition.y };
  }

  /**
   * Returns global coordinates of the pot's mouth where coins should enter.
   */
  public getMouthGlobalPosition(): { x: number; y: number } {
    return this.toGlobal(this._mouthPosition);
  }

  /**
   * Procedural rendering of the opulent Chinese Treasure Bowl / Fu Pot.
   */
  private renderPot(): void {
    // 1. Pot Body (Gold & Ruby Lacquer Urn)
    this._potBody.clear();

    // Shadow below pot
    this._potBody.ellipse(0, 36, 46, 12).fill({ color: 0x000000, alpha: 0.5 });

    // Golden Bowl Belly
    this._potBody
      .poly([
        -32, -14, // Left Rim
        32, -14,  // Right Rim
        44, 10,   // Bulging Right Belly
        26, 32,   // Right Base
        -26, 32,  // Left Base
        -44, 10,  // Bulging Left Belly
      ])
      .fill(0xd4af37)
      .stroke({ color: 0xfff099, width: 3 });

    // Inner Lacquer Center
    this._potBody
      .ellipse(0, 8, 26, 18)
      .fill(0x8b0000)
      .stroke({ color: 0xffd700, width: 2 });

    this._fuLabel.position.set(0, 8);

    // 2. Pot Lid (Constructed in its own sub-container for opening animations)
    this.renderLid();

    // 3. Mouth Position reference (where lid meets rim)
    this._mouthPosition = { x: 0, y: -16 };
  }

  private renderLid(): void {
    this._potLid.removeChildren();
    const g = new Graphics();

    // Golden Lid with tiered roof
    g.poly([
      -36, -14,
      -22, -26,
      22, -26,
      36, -14,
    ])
      .fill(0xd4af37)
      .stroke({ color: 0xfff099, width: 2.5 });

    // Top Dragon Pearl Finial
    g.circle(0, -30, 8).fill(0xdc143c).stroke({ color: 0xffd700, width: 2 });
    g.circle(0, -30, 3).fill(0xffffff);

    this._potLid.addChild(g);
  }

  /**
   * Sets the visual progression state of the Fu Pot.
   */
  public setState(newState: FuPotState): void {
    this.potState = newState;

    if (this._auraTween) {
      this._auraTween.kill();
      this._auraTween = undefined;
    }
    this._auraGlow.clear();
    this._overflowCoins.clear();

    switch (newState) {
      case FuPotState.DEFLATED:
        // Slightly thinner scale, dark aura
        gsap.to(this.scale, { x: 0.88, y: 0.88, duration: 0.4, ease: 'power2.out' });
        this._auraGlow.ellipse(0, 6, 50, 40).fill({ color: 0x331100, alpha: 0.2 });
        break;

      case FuPotState.NORMAL:
        gsap.to(this.scale, { x: 1.0, y: 1.0, duration: 0.4, ease: 'back.out(1.5)' });
        this._auraGlow.ellipse(0, 6, 60, 48).fill({ color: 0xffd700, alpha: 0.15 });
        break;

      case FuPotState.FILLING:
        // Plumper scale with gold ingots peeking out
        gsap.to(this.scale, { x: 1.12, y: 1.08, duration: 0.4, ease: 'back.out(2)' });
        this._auraGlow.ellipse(0, 6, 75, 58).fill({ color: 0xffa500, alpha: 0.3 });

        // A few gold ingots peeking under lid
        this._overflowCoins
          .circle(-12, -18, 7).fill(0xffd700)
          .circle(12, -18, 7).fill(0xffd700);
        break;

      case FuPotState.OVERFLOWING:
        // Full, glowing, pulsating with immense golden wealth
        gsap.to(this.scale, { x: 1.25, y: 1.18, duration: 0.4, ease: 'back.out(2.5)' });

        // Overflowing golden treasures
        this._overflowCoins
          .circle(-18, -20, 8).fill(0xffd700)
          .circle(0, -22, 9).fill(0xfff099)
          .circle(18, -20, 8).fill(0xffd700)
          .circle(-8, -25, 6).fill(0xdc143c) // Ruby gem
          .circle(10, -25, 6).fill(0x00a86b); // Jade gem

        // Pulsating golden heavenly radiance
        this._auraGlow.ellipse(0, 6, 95, 75).fill({ color: 0xffd700, alpha: 0.45 });
        this._auraTween = gsap.to(this._auraGlow, {
          alpha: 0.2,
          duration: 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        break;
    }
  }

  /**
   * Feeds the Fu Pot when a Wild symbol lands on the reels.
   *
   * @param wildScreenPos Global coordinates of the Wild symbol
   * @param particleManager Particle manager instance to shoot Bezier coins
   * @returns Promise<boolean> true if pot exploded and triggered Jackpot Mini-Game, false otherwise
   */
  public async feedWild(
    wildScreenPos: { x: number; y: number },
    particleManager: ParticleManager
  ): Promise<boolean> {
    const mouthPos = this.getMouthStagePosition();

    return new Promise<boolean>((resolve) => {
      // 1. Shoot flying Bezier coins from Wild symbol into Fu Pot
      particleManager.shootCoinsBezier(
        wildScreenPos.x,
        wildScreenPos.y,
        mouthPos.x,
        mouthPos.y,
        4,
        () => {
          // 2. On coins arrival: Squash & stretch physical bounce
          this._coinsCollected++;

          gsap.fromTo(
            this.scale,
            { x: this.scale.x * 1.28, y: this.scale.y * 0.8 },
            {
              x: this.scale.x,
              y: this.scale.y,
              duration: 0.45,
              ease: 'elastic.out(1.2, 0.4)',
            }
          );

          // Lid pops slightly
          gsap.fromTo(
            this._potLid.position,
            { y: -10 },
            { y: 0, duration: 0.35, ease: 'bounce.out' }
          );

          // 3. Progress State based on collected coins
          if (this._coinsCollected >= 9) {
            this.setState(FuPotState.OVERFLOWING);
          } else if (this._coinsCollected >= 4) {
            this.setState(FuPotState.FILLING);
          }

          // 4. Random Jackpot Trigger Evaluation
          // Probability: Higher when Overflowing (30%), Filling (12%), Normal (6%)
          let triggerChance = 0.06;
          if (this.potState === FuPotState.OVERFLOWING) triggerChance = 0.30;
          else if (this.potState === FuPotState.FILLING) triggerChance = 0.12;

          const isTriggered = Math.random() < triggerChance;

          if (isTriggered) {
            this.triggerExplosion(particleManager).then(() => {
              resolve(true);
            });
          } else {
            resolve(false);
          }
        }
      );
    });
  }

  /**
   * Explosive opening of the Fu Pot when Jackpot Bonus is triggered!
   */
  private async triggerExplosion(particleManager: ParticleManager): Promise<void> {
    const mouthPos = this.getMouthStagePosition();

    // Lid blasts off upward
    gsap.to(this._potLid.position, {
      y: -50,
      rotation: 0.3,
      duration: 0.4,
      ease: 'power3.out',
    });

    // Intense golden fireworks explosion
    particleManager.createSparkleBurst(mouthPos.x, mouthPos.y, 36, 0xffd700);
    particleManager.createSparkleBurst(mouthPos.x, mouthPos.y, 24, 0xff4500);
    particleManager.createSparkleBurst(mouthPos.x, mouthPos.y, 20, 0xffffff);

    // Camera/Pot shake
    gsap.fromTo(
      this.position,
      { x: this.position.x - 6 },
      { x: this.position.x + 6, duration: 0.05, repeat: 7, yoyo: true }
    );

    await new Promise((resolve) => setTimeout(resolve, 600));

    // Reset coins counter and pot to normal for next cycle
    this._coinsCollected = 0;
    gsap.to(this._potLid.position, { y: 0, rotation: 0, duration: 0.3 });
    this.setState(FuPotState.NORMAL);
  }
}
