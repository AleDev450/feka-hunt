import Phaser from 'phaser';
import { ANIM, frameIndex } from '../config/animations';
import { DEPTH, GAME_WIDTH, LOVE, WORLD } from '../config/settings';
import type { Dog } from '../entities/Dog';
import type { Hunter } from '../entities/Hunter';
import { TEX } from '../ui/proceduralTextures';
import { arcadeText } from '../ui/text';

const PINK = '#ff6fae';

/**
 * Escena entre niveles: la chica sale del perro, camina hasta el cazador,
 * le dice "Chi amu gordo" y vuelve a meterse en el perro. Toda la animación
 * se reparte en fracciones de `durationMs` (la duración del audio).
 */
export class LoveInterlude {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hunter: Hunter,
    private readonly dog: Dog,
  ) {}

  play(durationMs: number, onDone: () => void): void {
    const s = this.scene;
    const t = LOVE.timeline;
    const at = (fraction: number) => fraction * durationMs;
    const homeX = this.dog.x;
    const stopX = this.hunter.x + LOVE.stopOffsetX;
    this.dog.sit();

    const hearts = s.add.particles(0, 0, TEX.heart, {
      speed: { min: 40, max: 140 },
      angle: { min: 220, max: 320 },
      gravityY: -60,
      lifespan: 1100,
      scale: { start: 1, end: 0.4 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    hearts.setDepth(DEPTH.fx);

    // Texto grande con corazones a los lados
    const title = arcadeText(s, GAME_WIDTH / 2, 250, LOVE.text, 40, { color: PINK }).setDepth(DEPTH.banner);
    const leftHeart = s.add.image(title.x - title.width / 2 - 40, 250, TEX.heart).setScale(2).setDepth(DEPTH.banner);
    const rightHeart = s.add.image(title.x + title.width / 2 + 40, 250, TEX.heart).setScale(2).setDepth(DEPTH.banner);
    const titleParts = [title, leftHeart, rightHeart];
    title.setScale(0.3);
    s.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.easeOut' });
    s.tweens.add({ targets: [leftHeart, rightHeart], scale: 2.5, duration: 260, yoyo: true, repeat: -1 });
    s.tweens.add({ targets: titleParts, alpha: 0, delay: durationMs - 300, duration: 300 });

    // La chica "sale" del perro
    const girl = s.add
      .sprite(homeX, WORLD.hunter.y, 'girl', frameIndex('girl', 'walk1'))
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.hunter + 0.5)
      .setScale(0.2)
      .setAlpha(0)
      .setFlipX(true);
    hearts.explode(10, homeX, WORLD.hunter.y - 60);
    s.tweens.add({ targets: girl, scale: 1, alpha: 1, duration: at(t.appear), ease: 'Back.easeOut' });

    // Camina hacia el cazador
    s.time.delayedCall(at(t.appear), () => girl.play(ANIM.girlWalk));
    s.tweens.add({ targets: girl, x: stopX, delay: at(t.appear), duration: at(t.arrive - t.appear) });

    // Llega: se detiene frente a él y vuelan corazones
    s.time.delayedCall(at(t.arrive), () => {
      girl.anims.stop();
      girl.setFrame(frameIndex('girl', 'walk1'));
      hearts.explode(14, (girl.x + this.hunter.x) / 2, WORLD.hunter.y - 110);
      this.hunter.celebrate();
    });

    // Se va: vuelve caminando al perro y desaparece dentro de él
    s.time.delayedCall(at(t.leave), () => {
      girl.setFlipX(false).play(ANIM.girlWalk);
    });
    s.tweens.add({ targets: girl, x: homeX, delay: at(t.leave), duration: at(t.back - t.leave) });
    s.time.delayedCall(at(t.back), () => {
      girl.anims.stop();
      hearts.explode(10, homeX, WORLD.hunter.y - 60);
    });
    s.tweens.add({
      targets: girl,
      scale: 0.2,
      alpha: 0,
      delay: at(t.back),
      duration: at(1 - t.back),
      ease: 'Quad.easeIn',
    });

    s.time.delayedCall(durationMs, () => {
      girl.destroy();
      titleParts.forEach((p) => p.destroy());
      s.time.delayedCall(1200, () => hearts.destroy());
      onDone();
    });
  }
}
