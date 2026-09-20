import Phaser from 'phaser';
import { ANIM } from '../config/animations';
import { COLORS, DEPTH, DISCO, FRIENDS, GAME_HEIGHT, GAME_WIDTH } from '../config/settings';
import type { FriendsGroup } from '../entities/FriendsGroup';
import type { Jacinto } from '../entities/Jacinto';
import { arcadeText } from '../ui/text';

/**
 * Escena de los niveles pares: se apaga la partida un momento, suena
 * "ronchas" y los amigos se ponen en modo disco (luces de colores, bola y
 * poses de ánimo a toda velocidad) con Jacinto bailando al lado.
 */
export class DiscoInterlude {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly friends: FriendsGroup,
    private readonly mascot: Jacinto,
  ) {}

  play(durationMs: number, onDone: () => void): void {
    const s = this.scene;

    const ronchas = s.add.sprite(DISCO.dancer.x, DISCO.dancer.y, 'ronchas')
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.mascot)
      .play(ANIM.ronchasDance);
    s.tweens.add({
      targets: ronchas,
      y: DISCO.dancer.y - 12,
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Luces de colores sobre toda la escena
    const lights = s.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, DISCO.colors[0], 0.16)
      .setOrigin(0)
      .setDepth(DEPTH.fx + 2);

    // Bola de discoteca sobre el grupo
    const ballY = FRIENDS.y - 150;
    const rope = s.add.rectangle(FRIENDS.x, ballY - 60, 3, 60, 0x2a2a3a).setDepth(DEPTH.banner);
    const ball = s.add.circle(FRIENDS.x, ballY, 22, 0xc8ccd8).setDepth(DEPTH.banner);
    const glow = s.add.circle(FRIENDS.x, ballY, 30, DISCO.colors[0], 0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.banner);
    s.tweens.add({ targets: ball, scaleX: 0.6, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const title = arcadeText(s, GAME_WIDTH / 2, 250, DISCO.text, 42, { color: COLORS.goldText }).setDepth(DEPTH.banner);
    title.setScale(0.3);
    s.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.easeOut' });
    s.tweens.add({ targets: title, angle: 4, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    let step = 0;
    const timer = s.time.addEvent({
      delay: DISCO.lightMs,
      loop: true,
      callback: () => {
        const color = DISCO.colors[step++ % DISCO.colors.length];
        lights.setFillStyle(color, 0.16);
        glow.setFillStyle(color, 0.5);
        title.setColor(`#${color.toString(16).padStart(6, '0')}`);
      },
    });

    // Los amigos animan sin parar y Jacinto se mete a bailar
    this.friends.cheer(durationMs, false);
    this.mascot.dance(durationMs);

    s.time.delayedCall(durationMs - 400, () => {
      s.tweens.add({ targets: [title, lights, ball, glow, rope], alpha: 0, duration: 400 });
    });
    s.time.delayedCall(durationMs, () => {
      timer.remove();
      [ronchas, title, lights, ball, glow, rope].forEach((o) => {
        s.tweens.killTweensOf(o);
        o.destroy();
      });
      onDone();
    });
  }
}
