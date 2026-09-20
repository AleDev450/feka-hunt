import Phaser from 'phaser';
import { frameIndex } from '../config/animations';
import { SPRITE_SHEETS } from '../config/assetManifest';
import { COLORS, DEPTH, WORLD } from '../config/settings';
import { TEX } from '../ui/proceduralTextures';

export enum HunterPose {
  IDLE = 'IDLE',
  APUNTANDO = 'APUNTANDO',
  DISPARANDO = 'DISPARANDO',
  RECARGA = 'RECARGA',
  HERIDO = 'HERIDO',
  SALTANDO = 'SALTANDO',
  DETENIDO = 'DETENIDO',
}

/** Punta del cañón relativa a los pies (origen 0.5, 1) en el frame "apuntando" */
const MUZZLE = { x: 77, y: -114 };
const WAIST_Y = 141;
const { frameWidth: FRAME_W, frameHeight: FRAME_H } = SPRITE_SHEETS.hunter;

/**
 * El cazador conserva el frame "apuntando", dividido en piernas y torso.
 * El torso gira con la mira y las piernas mantienen los pies sobre el suelo.
 * Retroceso, fogonazo, daño y saltos se aplican a ambas partes.
 */
export class Hunter extends Phaser.GameObjects.Sprite {
  pose: HunterPose = HunterPose.IDLE;
  private readonly muzzleFlash: Phaser.GameObjects.Image;
  private readonly upperBody: Phaser.GameObjects.Sprite;
  private aimX = WORLD.hunter.x + 500;
  private aimY = WORLD.hunter.y + MUZZLE.y;

  constructor(scene: Phaser.Scene) {
    super(scene, WORLD.hunter.x, WORLD.hunter.y, 'hunter', frameIndex('hunter', 'aim'));
    this.setOrigin(0.5, 1).setDepth(DEPTH.hunter);
    scene.add.existing(this);
    this.setCrop(0, WAIST_Y, FRAME_W, FRAME_H - WAIST_Y);
    this.upperBody = scene.add.sprite(this.x, this.y, 'hunter', frameIndex('hunter', 'aim'))
      .setOrigin(0.5, WAIST_Y / FRAME_H)
      .setCrop(0, 0, FRAME_W, WAIST_Y)
      .setDepth(DEPTH.hunter + 0.01);
    this.muzzleFlash = scene.add.image(0, 0, TEX.spark).setDepth(DEPTH.hunter + 0.1).setVisible(false);
    this.syncAim();
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.upperBody.destroy();
      this.muzzleFlash.destroy();
    });
  }

  /** Orienta el torso y el cañón hacia la posición de la mira. */
  faceTowards(x: number, y = this.aimY): void {
    if (this.pose === HunterPose.DETENIDO) return;
    this.aimX = x;
    this.aimY = y;
    this.setFlipX(x < this.x);
    this.syncAim();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.syncAim();
  }

  private syncAim(): void {
    const pivotY = this.y - (FRAME_H - WAIST_Y);
    const dx = Math.abs(this.aimX - this.x);
    const dy = this.aimY - pivotY;
    const muzzleY = MUZZLE.y + FRAME_H - WAIST_Y;
    const distance = Math.max(Math.hypot(dx, dy), Math.abs(muzzleY) + 1);
    const angle = Math.atan2(dy, dx) - Math.asin(muzzleY / distance);
    this.upperBody.setPosition(this.x, pivotY).setFlipX(this.flipX)
      .setRotation(this.pose === HunterPose.DETENIDO ? 0 : angle * (this.flipX ? -1 : 1))
      .setTint(this.tintTopLeft).setAlpha(this.alpha).setVisible(this.visible);
  }

  setRestPose(pose: HunterPose): void {
    if (this.pose !== HunterPose.DETENIDO) this.pose = pose;
  }

  shoot(): void {
    this.pose = HunterPose.DISPARANDO;
    const dir = this.flipX ? -1 : 1;
    this.syncAim();
    const muzzle = this.upperBody.getWorldTransformMatrix().transformPoint(
      (MUZZLE.x + 10) * dir, MUZZLE.y + FRAME_H - WAIST_Y,
    );
    this.muzzleFlash
      .setPosition(muzzle.x, muzzle.y)
      .setScale(0.7)
      .setAlpha(1)
      .setVisible(true);
    this.scene.tweens.add({
      targets: this.muzzleFlash,
      scale: 1.1,
      alpha: 0,
      duration: 110,
      onComplete: () => this.muzzleFlash.setVisible(false),
    });
    // Retroceso: el cuerpo se va un poco hacia atrás y vuelve
    this.kick({ x: WORLD.hunter.x - 8 * dir }, 60);
  }

  reload(ms: number): void {
    this.pose = HunterPose.RECARGA;
    this.kick({ y: WORLD.hunter.y + 5 }, Math.min(ms / 2, 160));
  }

  hurt(): void {
    this.pose = HunterPose.HERIDO;
    this.setTint(COLORS.red);
    this.scene.time.delayedCall(350, () => this.clearTint());
    this.kick({ x: WORLD.hunter.x - 10 }, 50, 2);
  }

  celebrate(): void {
    this.pose = HunterPose.SALTANDO;
    this.kick({ y: WORLD.hunter.y - 36 }, 220);
  }

  /** Llega SERFOR: queda detenido, mirando a los agentes y sin moverse. */
  surrender(): void {
    this.pose = HunterPose.DETENIDO;
    this.scene.tweens.killTweensOf(this);
    this.setPosition(WORLD.hunter.x, WORLD.hunter.y).setFlipX(false);
    this.setTint(0xb8b8c8);
    this.syncAim();
  }

  /** Movimiento corto de ida y vuelta a la posición base. */
  private kick(to: { x?: number; y?: number }, duration: number, repeat = 0): void {
    this.scene.tweens.killTweensOf(this);
    this.setPosition(WORLD.hunter.x, WORLD.hunter.y);
    this.scene.tweens.add({
      targets: this,
      ...to,
      duration,
      yoyo: true,
      repeat,
      ease: 'Quad.easeOut',
      onComplete: () => this.setPosition(WORLD.hunter.x, WORLD.hunter.y),
    });
  }
}
