/**
 * SlotKita - High-Performance GPU Particle Manager
 * Phase 4: Coin Showers, Flying Bezier Wild Coins, and Jackpot Explosions
 */

import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';

export interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  vr: number; // Angular velocity
  gravity: number;
  life: number;
  maxLife: number;
  scaleSpeed: number;
}

export class ParticleManager extends Container {
  private _particles: Particle[] = [];
  private _tickerActive: boolean = false;

  constructor() {
    super();
    this.startTicker();
  }

  private startTicker(): void {
    if (this._tickerActive) return;
    this._tickerActive = true;

    gsap.ticker.add(this.updateParticles);
  }

  private updateParticles = (): void => {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];

      p.graphic.x += p.vx;
      p.graphic.y += p.vy;
      p.vy += p.gravity;
      p.graphic.rotation += p.vr;

      p.life++;
      const progress = p.life / p.maxLife;

      // Fade out near end of life
      if (progress > 0.7) {
        p.graphic.alpha = 1 - (progress - 0.7) / 0.3;
      }

      if (p.life >= p.maxLife || p.graphic.y > 900) {
        this.removeChild(p.graphic);
        p.graphic.destroy();
        this._particles.splice(i, 1);
      }
    }
  };

  /**
   * Draws a procedurally rendered golden coin graphic for particle use.
   */
  public createCoinGraphic(radius: number = 9): Graphics {
    const g = new Graphics();
    // Drop shadow
    g.circle(1, 1, radius).fill({ color: 0x000000, alpha: 0.3 });
    // Gold rim
    g.circle(0, 0, radius).fill(0xffd700).stroke({ color: 0xfff3a8, width: 1.5 });
    // Square cut-out
    const sq = radius * 0.55;
    g.rect(-sq / 2, -sq / 2, sq, sq).fill(0x8b0000).stroke({ color: 0x996515, width: 1 });
    return g;
  }

  /**
   * Shoots flying gold coins along a dramatic curved Bezier trajectory from Wild symbol to Fu Pot.
   *
   * @param startX Starting X (Wild symbol center)
   * @param startY Starting Y (Wild symbol center)
   * @param targetX Target X (Fu Pot mouth)
   * @param targetY Target Y (Fu Pot mouth)
   * @param coinCount Number of coins to emit (default 4)
   * @param onAllArrived Callback invoked when all coins have entered the pot
   */
  public shootCoinsBezier(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    coinCount: number = 4,
    onAllArrived?: () => void
  ): void {
    let arrivedCount = 0;

    for (let i = 0; i < coinCount; i++) {
      const coin = this.createCoinGraphic(11);
      coin.position.set(startX, startY);
      coin.scale.set(0.6);
      this.addChild(coin);

      // Random control point for dynamic arced trajectory
      const curveHeight = -80 - Math.random() * 60;
      const midX = (startX + targetX) / 2 + (Math.random() * 80 - 40);
      const midY = Math.min(startY, targetY) + curveHeight;

      const duration = 0.65 + i * 0.08;
      const delay = i * 0.07;

      // Spin rotation during flight
      gsap.to(coin, {
        rotation: Math.PI * 4 * (Math.random() > 0.5 ? 1 : -1),
        duration,
        delay,
        ease: 'none',
      });

      // Scale pulse up then into pot
      gsap.to(coin.scale, {
        x: 1.1,
        y: 1.1,
        duration: duration * 0.5,
        delay,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      });

      // Bezier curve motion
      const pathObj = { progress: 0 };
      gsap.to(pathObj, {
        progress: 1,
        duration,
        delay,
        ease: 'power2.in',
        onUpdate: () => {
          const t = pathObj.progress;
          // Quadratic Bezier Formula: B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
          const invT = 1 - t;
          coin.x = invT * invT * startX + 2 * invT * t * midX + t * t * targetX;
          coin.y = invT * invT * startY + 2 * invT * t * midY + t * t * targetY;
        },
        onComplete: () => {
          this.createSparkleBurst(targetX, targetY, 6, 0xffd700);
          this.removeChild(coin);
          coin.destroy();

          arrivedCount++;
          if (arrivedCount === coinCount && onAllArrived) {
            onAllArrived();
          }
        },
      });
    }
  }

  /**
   * Spawns a radial burst of glittering stars & sparks (used when coins enter pot or pot explodes).
   */
  public createSparkleBurst(
    x: number,
    y: number,
    count: number = 16,
    color: number = 0xffd700
  ): void {
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      const radius = 2.5 + Math.random() * 3.5;
      g.circle(0, 0, radius).fill(color);
      g.position.set(x, y);
      this.addChild(g);

      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = 3 + Math.random() * 5;

      this._particles.push({
        graphic: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        vr: 0.1,
        gravity: 0.15,
        life: 0,
        maxLife: 25 + Math.random() * 15,
        scaleSpeed: 0.02,
      });
    }
  }

  /**
   * Triggers a massive gold coin fountain / rain across the entire screen.
   *
   * @param durationSeconds Duration of coin shower (e.g. 2.5s for Mega Win)
   * @param intensity Coins spawned per frame batch (default 3)
   */
  public triggerCoinShower(durationSeconds: number = 3.0, intensity: number = 3): void {
    const startTime = performance.now();

    const spawnBatch = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed > durationSeconds) {
        gsap.ticker.remove(spawnBatch);
        return;
      }

      for (let i = 0; i < intensity; i++) {
        const coin = this.createCoinGraphic(8 + Math.random() * 5);
        coin.position.set(50 + Math.random() * 700, -30);
        this.addChild(coin);

        this._particles.push({
          graphic: coin,
          vx: Math.random() * 4 - 2,
          vy: 2 + Math.random() * 4,
          vr: Math.random() * 0.2 - 0.1,
          gravity: 0.22,
          life: 0,
          maxLife: 90 + Math.random() * 40,
          scaleSpeed: 0,
        });
      }
    };

    gsap.ticker.add(spawnBatch);
  }

  /**
   * Destroys particle manager and clears all active particles.
   */
  public override destroy(): void {
    gsap.ticker.remove(this.updateParticles);
    this._particles = [];
    super.destroy({ children: true });
  }
}
