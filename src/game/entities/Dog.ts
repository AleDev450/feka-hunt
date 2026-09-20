import Phaser from 'phaser';
import { ANIM, frameIndex } from '../config/animations';
import { DEPTH, WORLD } from '../config/settings';
import type { AudioSystem } from '../systems/AudioSystem';
import { clamp } from '../utils/gameUtils';

export enum DogState {
  IDLE = 'IDLE',
  CORRIENDO = 'CORRIENDO',
  LADRANDO = 'LADRANDO',
  SENTADO = 'SENTADO',
  EXCITADO = 'EXCITADO',
}

const RUN_SPEED = 520; // px/s

/**
 * Perro compañero. Solo reacciona a lo que ocurre (no afecta al gameplay):
 * corre hacia el gallinazo abatido, ladra cuando uno escapa y celebra al
 * final de ronda.
 */
export class Dog extends Phaser.GameObjects.Sprite {
  dogState: DogState = DogState.SENTADO;

  constructor(
    scene: Phaser.Scene,
    private readonly audio: AudioSystem | null,
  ) {
    super(scene, WORLD.dog.homeX, WORLD.dog.y, 'dog', frameIndex('dog', 'sit'));
    this.setOrigin(0.5, 1).setDepth(DEPTH.dog).setFlipX(true);
    scene.add.existing(this);
  }

  /** Corre hasta donde cayó el gallinazo, celebra y vuelve a su sitio. */
  fetch(x: number): void {
    const target = clamp(x, WORLD.dog.minX, WORLD.dog.maxX);
    this.runTo(target, () => this.excited(2, () => this.goHome()));
  }

  /**
   * El jugador falló el disparo: el perro se queja ("¡awa!"), da un saltito
   * hacia atrás y vuelve a sentarse.
   */
  complain(): void {
    this.cancel();
    this.dogState = DogState.LADRANDO;
    this.setFrame(frameIndex('dog', 'bark'));
    this.audio?.play('awa');
    this.scene.tweens.add({
      targets: this,
      y: WORLD.dog.y - 12,
      duration: 110,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.dogState === DogState.LADRANDO) this.sit();
      },
    });
  }

  /** Ladra (se burla) cuando un gallinazo escapa. */
  bark(): void {
    this.cancel();
    this.dogState = DogState.LADRANDO;
    this.play(ANIM.dogBark);
    this.audio?.play('bark');
    this.scene.time.delayedCall(1100, () => {
      if (this.dogState === DogState.LADRANDO) this.sit();
    });
  }

  /** Celebración de final de ronda. */
  celebrate(): void {
    this.excited(3, () => this.sit());
  }

  sit(): void {
    this.cancel();
    this.dogState = DogState.SENTADO;
    this.setFrame(frameIndex('dog', 'sit'));
  }

  idle(): void {
    this.cancel();
    this.dogState = DogState.IDLE;
    this.setFrame(frameIndex('dog', 'idle'));
  }

  private goHome(): void {
    this.runTo(WORLD.dog.homeX, () => {
      this.setFlipX(true);
      this.sit();
    });
  }

  private runTo(x: number, onArrive: () => void): void {
    this.cancel();
    this.dogState = DogState.CORRIENDO;
    this.setFlipX(x < this.x);
    this.play(ANIM.dogRun);
    this.scene.tweens.add({
      targets: this,
      x,
      duration: (Math.abs(x - this.x) / RUN_SPEED) * 1000 + 60,
      onComplete: onArrive,
    });
  }

  private excited(hops: number, onDone: () => void): void {
    this.cancel();
    this.dogState = DogState.EXCITADO;
    this.setFrame(frameIndex('dog', 'excited'));
    this.scene.tweens.add({
      targets: this,
      y: WORLD.dog.y - 26,
      duration: 170,
      yoyo: true,
      repeat: hops - 1,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.setY(WORLD.dog.y);
        onDone();
      },
    });
  }

  private cancel(): void {
    this.scene.tweens.killTweensOf(this);
    this.anims.stop();
    this.setY(WORLD.dog.y);
  }
}
