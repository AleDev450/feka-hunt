import Phaser from 'phaser';
import { COLORS, DEPTH, TIMING } from '../config/settings';

/**
 * Mira del jugador. En desktop sigue al mouse; en táctil aparece donde se
 * toca y se desvanece poco después para no tapar el juego.
 */
export class Crosshair extends Phaser.GameObjects.Image {
  private hideTimer = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly touchMode: boolean,
  ) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2, 'crosshair');
    this.setDepth(DEPTH.crosshair).setVisible(!touchMode);
    scene.add.existing(this);
  }

  moveTo(x: number, y: number): void {
    this.setPosition(x, y);
    if (this.touchMode) {
      this.setVisible(true).setAlpha(1);
      this.hideTimer = TIMING.touchCrosshairVisibleMs;
    }
  }

  /** Rojo cuando hay un gallinazo bajo la mira. */
  setLocked(locked: boolean): this {
    return locked ? this.setTint(COLORS.red) : this.clearTint();
  }

  kick(): void {
    this.scene.tweens.killTweensOf(this);
    this.setScale(1.25);
    this.scene.tweens.add({ targets: this, scale: 1, duration: 120, ease: 'Quad.easeOut' });
  }

  preUpdate(_time: number, delta: number): void {
    if (!this.touchMode || this.hideTimer <= 0) return;
    this.hideTimer -= delta;
    if (this.hideTimer < 250) this.setAlpha(Math.max(0, this.hideTimer / 250));
    if (this.hideTimer <= 0) this.setVisible(false);
  }
}
