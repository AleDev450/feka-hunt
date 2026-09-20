import Phaser from 'phaser';
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
const MUZZLE = { x: 63, y: -105 };

/**
 * El cazador usa diez poses completas del nuevo spritesheet. Cada pose cubre
 * una altura de la mira y cada lado, así el personaje nunca se corta al apuntar.
 */
export class Hunter extends Phaser.GameObjects.Sprite {
  pose: HunterPose = HunterPose.IDLE;
  private readonly muzzleFlash: Phaser.GameObjects.Image;
  private aimX = WORLD.hunter.x + 500;
  private aimY = WORLD.hunter.y + MUZZLE.y;

  constructor(scene: Phaser.Scene) {
    super(scene, WORLD.hunter.x, WORLD.hunter.y, 'hunterAim', 2);
    this.setOrigin(0.5, 1).setDepth(DEPTH.hunter);
    scene.add.existing(this);
    this.muzzleFlash = scene.add.image(0, 0, TEX.spark).setDepth(DEPTH.hunter + 0.1).setVisible(false);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.muzzleFlash.destroy();
    });
  }

  /** Orienta el torso y el cañón hacia la posición de la mira. */
  faceTowards(x: number, y = this.aimY): void {
    if (this.pose === HunterPose.DETENIDO) return;
    this.aimX = x;
    this.aimY = y;
    this.setFlipX(false);
    this.setFrame(this.aimFrame(x < this.x, y));
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
  }

  private aimFrame(left: boolean, y: number): number {
    const row = left ? 5 : 0;
    const column = y < 180 ? 0 : y < 300 ? 1 : y < 430 ? 2 : y < 560 ? 3 : 4;
    return row + column;
  }

  setRestPose(pose: HunterPose): void {
    if (this.pose !== HunterPose.DETENIDO) this.pose = pose;
  }

  shoot(): void {
    this.pose = HunterPose.DISPARANDO;
    const dir = this.aimX < this.x ? -1 : 1;
    this.muzzleFlash
      .setPosition(this.x + MUZZLE.x * dir, this.y + MUZZLE.y)
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
