import type Phaser from 'phaser';
import { frameIndex, type FrameName } from '../config/animations';
import { COLORS, DEPTH, FRIENDS } from '../config/settings';
import { arcadeText } from '../ui/text';
import { pick } from '../utils/gameUtils';

const MEMBERS = ['mascara', 'mochila', 'chaqueta', 'pelolargo', 'barbudo', 'auriculares'] as const;
type Member = (typeof MEMBERS)[number];

const CHEER = ['cheer1', 'cheer2', 'cheer3', 'cheer4'] as const;
const SAD = ['sad1', 'sad2', 'sad3'] as const;
type Pose = (typeof CHEER)[number] | (typeof SAD)[number];

const frame = (member: Member, pose: Pose): number => frameIndex('friends', `${member}_${pose}` as FrameName<'friends'>);

/**
 * Grupo de amigos al fondo del mapa (imgs/grupo_amigos_2.jpg).
 * Animan cuando el cazador abate un gallinazo y se ponen tristes cuando
 * falla o se le escapa uno. Solo es decoración reactiva.
 */
export class FriendsGroup {
  private readonly members: { sprite: Phaser.GameObjects.Sprite; member: Member }[];
  private readonly shout: Phaser.GameObjects.Text;
  private frameTimer: Phaser.Time.TimerEvent | null = null;
  private resetTimer: Phaser.Time.TimerEvent | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    const startX = FRIENDS.x - ((MEMBERS.length - 1) * FRIENDS.spacing) / 2;
    this.members = MEMBERS.map((member, i) => ({
      member,
      sprite: scene.add
        .sprite(startX + i * FRIENDS.spacing, FRIENDS.y, 'friends', frame(member, 'cheer1'))
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.friends),
    }));
    this.shout = arcadeText(scene, FRIENDS.x, FRIENDS.y - 82, '', 12).setDepth(DEPTH.friends + 0.1).setVisible(false);
  }

  /** Abatió un gallinazo: todos animan, saltan y le gritan al gordo. */
  cheer(durationMs: number = FRIENDS.cheerMs, withMessage = true): void {
    this.reset();
    this.cycle(CHEER, FRIENDS.frameMs, true);
    this.members.forEach(({ sprite }, i) => {
      this.scene.tweens.add({
        targets: sprite,
        y: FRIENDS.y - 8,
        duration: 150,
        delay: i * 50,
        yoyo: true,
        repeat: Math.max(0, Math.floor(durationMs / 300) - 1),
        ease: 'Quad.easeOut',
      });
    });
    if (withMessage) this.say(pick(FRIENDS.cheerPhrases), COLORS.goldText, durationMs);
    this.resetTimer = this.scene.time.delayedCall(durationMs, () => this.reset());
  }

  /** Falló o se le escapó: se tapan la cara y bajan la cabeza. */
  sad(durationMs: number = FRIENDS.sadMs, withMessage = true): void {
    this.reset();
    this.cycle(SAD, FRIENDS.frameMs * 1.8, false);
    if (withMessage) this.say(pick(FRIENDS.sadPhrases), COLORS.blueText, durationMs);
    this.resetTimer = this.scene.time.delayedCall(durationMs, () => this.reset());
  }

  /**
   * Recorre las poses de cada amigo, desfasadas entre sí para que no se
   * muevan todos igual. Si `loop` es false se queda en la última pose.
   */
  private cycle(poses: readonly Pose[], delay: number, loop: boolean): void {
    let step = 0;
    const apply = () =>
      this.members.forEach(({ sprite, member }, i) => {
        const index = loop ? (step + i) % poses.length : Math.min(step, poses.length - 1);
        sprite.setFrame(frame(member, poses[index]));
      });
    apply();
    this.frameTimer = this.scene.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        step++;
        apply();
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
    this.members.forEach(({ sprite, member }) => {
      this.scene.tweens.killTweensOf(sprite);
      sprite.setFrame(frame(member, 'cheer1')).setY(FRIENDS.y);
    });
  }
}
