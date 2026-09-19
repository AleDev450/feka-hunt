import Phaser from 'phaser';
import { frameIndex } from '../config/animations';
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
const MUZZLE = { x: 70, y: -101 };

/**
 * El cazador. Usa SIEMPRE el mismo sprite ("apuntando"): las poses del
 * spritesheet de referencia están dibujadas de forma distinta entre sí y al
 * alternarlas parecía otro personaje. Los estados se expresan con efectos
 * sobre ese único sprite (retroceso, fogonazo, destello rojo, salto...).
 */
export class Hunter extends Phaser.GameObjects.Sprite {
  pose: HunterPose = HunterPose.IDLE;
  private readonly muzzleFlash: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, WORLD.hunter.x, WORLD.hunter.y, 'hunter', frameIndex('hunter', 'aim'));
    this.setOrigin(0.5, 1).setDepth(DEPTH.hunter);
    scene.add.existing(this);
    this.muzzleFlash = scene.add.image(0, 0, TEX.spark).setDepth(DEPTH.hunter + 0.1).setVisible(false);
  }

  /** Mira hacia el lado donde apunta el jugador. */
  faceTowards(x: number): void {
    if (this.pose === HunterPose.DETENIDO) return;
    if (Math.abs(x - this.x) > 30) this.setFlipX(x < this.x);
  }

  setRestPose(pose: HunterPose): void {
    if (this.pose !== HunterPose.DETENIDO) this.pose = pose;
  }

  shoot(): void {
    this.pose = HunterPose.DISPARANDO;
    const dir = this.flipX ? -1 : 1;
    this.muzzleFlash
      .setPosition(WORLD.hunter.x + MUZZLE.x * dir + 10 * dir, WORLD.hunter.y + MUZZLE.y)
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
