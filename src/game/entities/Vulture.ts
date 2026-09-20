import Phaser from 'phaser';
import {
  framesByIndex,
  VULTURE_TYPES,
  vultureFlyAnim,
  vultureFrame,
  type FrameMeta,
  type VultureType,
} from '../config/animations';
import { SPRITE_SHEETS } from '../config/assetManifest';
import { DEPTH, GAME_WIDTH, TIMING, WORLD, type FlightPattern, type SpawnSide } from '../config/settings';
import type { DifficultyParams } from '../systems/DifficultySystem';
import { distanceToRect, pick, randomRange } from '../utils/gameUtils';

export enum VultureState {
  FLYING = 'FLYING',
  HIT = 'HIT',
  FALLING = 'FALLING',
  DEAD = 'DEAD',
  ESCAPED = 'ESCAPED',
}

export type VultureOutcome = 'killed' | 'escaped';
export type HitZone = 'head' | 'body';

const FRAMES: FrameMeta[] = framesByIndex('vulture');
const { frameWidth: FW, frameHeight: FH } = SPRITE_SHEETS.vulture;
/** Proporción del sprite que se descuenta del hitbox (alas con plumas sueltas) */
const HITBOX_INSET = 0.12;

/**
 * Gallinazo. Reutilizable (pooling): `spawn()` lo reactiva con nuevos
 * parámetros y `onResolved` avisa cuando sale del juego (abatido o escapado).
 */
export class Vulture extends Phaser.GameObjects.Sprite {
  vState: VultureState = VultureState.DEAD;
  onResolved: ((vulture: Vulture, outcome: VultureOutcome) => void) | null = null;

  private vx = 0;
  private vy = 0;
  private speed = 0;
  private pattern: FlightPattern = 'straight';
  /** Tipo de gallinazo de esta vuelta (se sortea en cada aparición) */
  private vType: VultureType = 'clasico';
  private elapsed = 0;
  private flyTimeMs = 0;
  private stateTimer = 0;
  private turnTimer = 0;
  private turnIntervalMs = 0;
  private phase = 0;
  private waveAmplitude = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, -300, -300, 'vulture', 0);
    this.setActive(false).setVisible(false).setDepth(DEPTH.vultures);
  }

  get isHittable(): boolean {
    return this.active && (this.vState === VultureState.FLYING || this.vState === VultureState.ESCAPED);
  }

  spawn(params: DifficultyParams, side: SpawnSide, pattern: FlightPattern, slot = 0, slots = 1, forcedType?: VultureType): this {
    const area = WORLD.flyArea;
    this.speed = params.speed * randomRange(1 - params.speedJitter, 1 + params.speedJitter);
    this.pattern = pattern;
    this.flyTimeMs = params.flyTimeMs * randomRange(0.9, 1.1);
    this.turnIntervalMs = params.turnIntervalMs;
    this.waveAmplitude = params.waveAmplitude * (pattern === 'swoop' ? 2.2 : 1);
    this.elapsed = 0;
    this.stateTimer = 0;
    this.turnTimer = this.turnIntervalMs * randomRange(0.5, 1);
    this.phase = randomRange(0, Math.PI * 2);

    if (side === 'bottom') {
      // Repartir en franjas cuando salen varios a la vez
      const laneW = (area.right - area.left - 240) / slots;
      const x = area.left + 120 + laneW * slot + randomRange(0.15, 0.85) * laneW;
      const dir = x < GAME_WIDTH / 2 ? 1 : -1;
      const angle = Phaser.Math.DegToRad(randomRange(25, 60));
      this.setPosition(x, area.bottom - 20);
      this.setVelocity(Math.sin(angle) * dir * (Math.random() < 0.8 ? 1 : -1), -Math.cos(angle));
    } else {
      const dir = side === 'left' ? 1 : -1;
      const angle = Phaser.Math.DegToRad(randomRange(-25, 20));
      this.setPosition(side === 'left' ? area.left + 10 : area.right - 10, randomRange(area.top + 40, area.bottom - 140));
      this.setVelocity(Math.cos(angle) * dir, Math.sin(angle));
    }

    this.vState = VultureState.FLYING;
    this.vType = forcedType ?? pick(VULTURE_TYPES);
    this.setActive(true).setVisible(true).setAlpha(1).setDepth(DEPTH.vultures);
    this.play(vultureFlyAnim(this.vType));
    this.anims.timeScale = params.flapFps / 10;
    return this;
  }

  /** Huye hacia arriba (tiempo agotado o sin munición). Sigue siendo disparable. */
  flee(): boolean {
    if (this.vState !== VultureState.FLYING) return false;
    this.vState = VultureState.ESCAPED;
    // La fuga es visible: sube rápido hasta salir por arriba del escenario.
    const sideways = Math.sign(this.vx) || 1;
    this.vx = sideways * this.speed * 0.45;
    this.vy = -this.speed * 2.1;
    this.setAlpha(1);
    this.anims.timeScale *= 1.5;
    return true;
  }

  hit(): void {
    this.vState = VultureState.HIT;
    this.stateTimer = TIMING.hitFreezeMs;
    this.anims.stop();
    this.setFrame(vultureFrame(this.vType, 'fall'));
    this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    // Delante del pasto para que se vea caer y quedar tendido
    this.setDepth(DEPTH.foreground + 0.5);
  }

  /** Comprueba si un disparo en (px, py) impacta. */
  hitTest(px: number, py: number, tolerance: number, headRadius: number): HitZone | null {
    if (!this.isHittable) return null;
    const meta = FRAMES[Number(this.frame.name)] ?? FRAMES[0];
    if (meta.head) {
      const head = this.toWorld(meta.head.x, meta.head.y);
      if (Math.hypot(px - head.x, py - head.y) <= headRadius + tolerance * 0.5) return 'head';
    }
    const { body } = meta;
    const insetX = body.w * HITBOX_INSET;
    const insetY = body.h * HITBOX_INSET;
    const left = this.flipX ? FW - (body.x + body.w - insetX) : body.x + insetX;
    const x = this.x + left - FW / 2;
    const y = this.y + body.y + insetY - FH / 2;
    return distanceToRect(px, py, x, y, body.w - insetX * 2, body.h - insetY * 2) <= tolerance ? 'body' : null;
  }

  deactivate(): void {
    this.anims.stop();
    this.setActive(false).setVisible(false);
    this.vState = VultureState.DEAD;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const dt = delta / 1000;
    switch (this.vState) {
      case VultureState.FLYING:
        this.updateFlying(delta, dt);
        break;
      case VultureState.ESCAPED:
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.setFlipX(this.vx < 0);
        if (this.y < -130 || this.x < -160 || this.x > GAME_WIDTH + 160) this.resolve('escaped');
        break;
      case VultureState.HIT:
        this.stateTimer -= delta;
        if (this.stateTimer < TIMING.hitFreezeMs - 70) this.setTintMode(Phaser.TintModes.MULTIPLY).clearTint();
        if (this.stateTimer <= 0) {
          this.vState = VultureState.FALLING;
          this.vy = 80;
          this.stateTimer = 0;
        }
        break;
      case VultureState.FALLING:
        this.vy += TIMING.fallGravity * dt;
        this.y += this.vy * dt;
        // Voltereta: alternar el flip simula que cae girando
        this.stateTimer += delta;
        if (this.stateTimer > 110) {
          this.stateTimer = 0;
          this.toggleFlipX();
        }
        if (this.y >= WORLD.landingY) {
          this.y = WORLD.landingY;
          this.vState = VultureState.DEAD;
          this.setFrame(vultureFrame(this.vType, 'dead'));
          this.stateTimer = TIMING.deadVisibleMs;
          this.emit('landed', this);
        }
        break;
      case VultureState.DEAD:
        if (!this.active) break;
        this.stateTimer -= delta;
        if (this.stateTimer < 300) this.setAlpha(Math.max(0, this.stateTimer / 300));
        if (this.stateTimer <= 0) this.resolve('killed');
        break;
    }
  }

  private setVelocity(dirX: number, dirY: number): void {
    const len = Math.hypot(dirX, dirY) || 1;
    this.vx = (dirX / len) * this.speed;
    this.vy = (dirY / len) * this.speed;
  }

  private updateFlying(delta: number, dt: number): void {
    const area = WORLD.flyArea;
    this.elapsed += delta;

    if (this.pattern === 'zigzag') {
      this.turnTimer -= delta;
      if (this.turnTimer <= 0) {
        this.turnTimer = this.turnIntervalMs * randomRange(0.7, 1.3);
        const keepSide = Math.random() < 0.7 ? Math.sign(this.vx) || 1 : -(Math.sign(this.vx) || 1);
        const angle = Phaser.Math.DegToRad(randomRange(-60, 60));
        this.setVelocity(Math.cos(angle) * keepSide, Math.sin(angle));
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.pattern === 'wave' || this.pattern === 'swoop') {
      const omega = Math.PI * 2 * (this.pattern === 'wave' ? 0.8 : 0.45);
      this.phase += omega * dt;
      this.y += Math.cos(this.phase) * this.waveAmplitude * omega * dt;
    }

    if ((this.x <= area.left && this.vx < 0) || (this.x >= area.right && this.vx > 0)) this.vx = -this.vx;
    if ((this.y <= area.top && this.vy < 0) || (this.y >= area.bottom && this.vy > 0)) this.vy = -this.vy;
    this.x = Phaser.Math.Clamp(this.x, area.left, area.right);
    this.y = Phaser.Math.Clamp(this.y, area.top, area.bottom);

    this.setFlipX(this.vx < 0);
    if (this.elapsed >= this.flyTimeMs && this.flee()) this.emit('flee', this);
  }

  private toWorld(fx: number, fy: number): { x: number; y: number } {
    const lx = this.flipX ? FW - fx : fx;
    return { x: this.x + lx - FW / 2, y: this.y + fy - FH / 2 };
  }

  private resolve(outcome: VultureOutcome): void {
    this.deactivate();
    this.onResolved?.(this, outcome);
  }
}
