import Phaser from 'phaser';
import { ANIM, frameIndex } from '../config/animations';
import { DEPTH, MASCOT } from '../config/settings';
import type { AudioSystem } from '../systems/AudioSystem';
import { clamp } from '../utils/gameUtils';

export enum JacintoState {
  IDLE = 'IDLE',
  CORRIENDO = 'CORRIENDO',
  RECIBIENDO = 'RECIBIENDO',
  CELEBRANDO = 'CELEBRANDO',
}

/**
 * Pequeño Jacinto, la mascota del cazador (imgs/pequeno_jancito.png).
 * Solo reacciona a lo que pasa, no afecta al gameplay: corre hacia el
 * gallinazo abatido, recibe el golpe cuando el jugador falla y celebra al
 * final de la ronda.
 */
export class Jacinto extends Phaser.GameObjects.Sprite {
  jacintoState: JacintoState = JacintoState.IDLE;

  constructor(
    scene: Phaser.Scene,
    private readonly audio: AudioSystem | null,
  ) {
    super(scene, MASCOT.homeX, MASCOT.y, 'jacinto', frameIndex('jacinto', 'idle1'));
    this.setOrigin(0.5, 1).setDepth(DEPTH.mascot);
    scene.add.existing(this);
    this.idle();
  }

  /** Corre hasta donde cayó el gallinazo, celebra y vuelve a su sitio. */
  fetch(x: number): void {
    const target = clamp(x, MASCOT.minX, MASCOT.maxX);
    this.runTo(target, () => this.excited(2, () => this.goHome()));
  }

  /** El jugador falló el disparo: recibe el golpe y se queja ("¡awa!"). */
  complain(): void {
    this.takeHit(MASCOT.complainMs);
  }

  /** Se escapó un gallinazo (o llega SERFOR): se lleva el disgusto. */
  upset(): void {
    this.takeHit(MASCOT.upsetMs);
  }

  /** Celebración de final de ronda. */
  celebrate(): void {
    this.excited(3, () => this.idle());
  }

  idle(): void {
    this.cancel();
    this.jacintoState = JacintoState.IDLE;
    this.play(ANIM.jacintoIdle);
  }

  private takeHit(durationMs: number): void {
    this.cancel();
    this.jacintoState = JacintoState.RECIBIENDO;
    this.play(ANIM.jacintoHit);
    this.audio?.play('awa');
    // Saltito hacia atrás por el golpe
    this.scene.tweens.add({
      targets: this,
      y: MASCOT.y - 10,
      duration: 110,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    this.scene.time.delayedCall(durationMs, () => {
      if (this.jacintoState === JacintoState.RECIBIENDO) this.idle();
    });
  }

  private goHome(): void {
    this.runTo(MASCOT.homeX, () => {
      this.setFlipX(false);
      this.idle();
    });
  }

  private runTo(x: number, onArrive: () => void): void {
    this.cancel();
    this.jacintoState = JacintoState.CORRIENDO;
    this.setFlipX(x < this.x);
    this.play(ANIM.jacintoRun);
    this.scene.tweens.add({
      targets: this,
      x,
      duration: (Math.abs(x - this.x) / MASCOT.runSpeed) * 1000 + 60,
      onComplete: onArrive,
    });
  }

  private excited(hops: number, onDone: () => void): void {
    this.cancel();
    this.jacintoState = JacintoState.CELEBRANDO;
    this.play(ANIM.jacintoIdle);
    this.anims.timeScale = 1.8;
    this.scene.tweens.add({
      targets: this,
      y: MASCOT.y - 26,
      duration: 170,
      yoyo: true,
      repeat: hops - 1,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.anims.timeScale = 1;
        this.setY(MASCOT.y);
        onDone();
      },
    });
  }

  private cancel(): void {
    this.scene.tweens.killTweensOf(this);
    this.anims.timeScale = 1;
    this.setY(MASCOT.y);
  }
}
