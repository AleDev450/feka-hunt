import type Phaser from 'phaser';
import { frameIndex, type FrameName } from '../config/animations';
import { COLORS, DEPTH, FRIENDS } from '../config/settings';
import { arcadeText } from '../ui/text';
import { pick } from '../utils/gameUtils';

const CHEER = ['cheer1', 'cheer2', 'cheer3', 'cheer4'] as const;
const SAD = ['sad1', 'sad2', 'sad3', 'sad4'] as const;
type Pose = (typeof CHEER)[number] | (typeof SAD)[number];

const frame = (pose: Pose): number => frameIndex('friends', pose as FrameName<'friends'>);

/**
 * Grupo de amigos al fondo del mapa (imgs/grupo_amigos_3.png). La hoja trae
 * al grupo entero dibujado junto, así que es un único sprite que cambia de
 * pose: animan cuando el cazador abate un gallinazo y se ponen tristes
 * cuando falla o se le escapa uno.
 */
export class FriendsGroup {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shout: Phaser.GameObjects.Text;
  private frameTimer: Phaser.Time.TimerEvent | null = null;
  private resetTimer: Phaser.Time.TimerEvent | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    this.sprite = scene.add
      .sprite(FRIENDS.x, FRIENDS.y, 'friends', frame('cheer1'))
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.friends);
    this.shout = arcadeText(scene, FRIENDS.x, FRIENDS.y - this.sprite.height - 16, '', 12)
      .setDepth(DEPTH.friends + 0.1)
      .setVisible(false);
  }

  /** Abatió un gallinazo: el grupo anima y le grita al gordo. */
  cheer(durationMs: number = FRIENDS.cheerMs, withMessage = true): void {
    this.reset();
    this.cycle(CHEER, FRIENDS.frameMs, true);
    this.scene.tweens.add({
      targets: this.sprite,
      y: FRIENDS.y - 8,
      duration: 150,
      yoyo: true,
      repeat: Math.max(0, Math.floor(durationMs / 300) - 1),
      ease: 'Quad.easeOut',
    });
    if (withMessage) this.say(pick(FRIENDS.cheerPhrases), COLORS.goldText, durationMs);
    this.resetTimer = this.scene.time.delayedCall(durationMs, () => this.reset());
  }

  /** Falló o se le escapó: se tapan la cara y bajan la cabeza. */
  sad(durationMs: number = FRIENDS.sadMs, withMessage = true): void {
    this.reset();
    this.cycle(SAD, FRIENDS.frameMs * 1.6, false);
    if (withMessage) this.say(pick(FRIENDS.sadPhrases), COLORS.blueText, durationMs);
    this.resetTimer = this.scene.time.delayedCall(durationMs, () => this.reset());
  }

  /** Recorre las poses; si `loop` es false se queda en la última. */
  private cycle(poses: readonly Pose[], delay: number, loop: boolean): void {
    let step = 0;
    this.sprite.setFrame(frame(poses[0]));
    this.frameTimer = this.scene.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        step++;
        this.sprite.setFrame(frame(poses[loop ? step % poses.length : Math.min(step, poses.length - 1)]));
      },
    });
  }

  private say(text: string, color: string, durationMs: number): void {
    this.scene.tweens.killTweensOf(this.shout);
    this.shout.setText(text).setColor(color).setAlpha(1).setScale(0.5).setVisible(true);
    this.scene.tweens.add({ targets: this.shout, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.scene.tweens.add({
      targets: this.shout,
      alpha: 0,
      delay: durationMs - 300,
      duration: 300,
      onComplete: () => this.shout.setVisible(false),
    });
  }

  /** Vuelve al reposo: primera pose de ánimo, quietos. */
  private reset(): void {
    this.frameTimer?.remove();
    this.resetTimer?.remove();
    this.frameTimer = null;
    this.resetTimer = null;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setFrame(frame('cheer1')).setY(FRIENDS.y);
  }
}
