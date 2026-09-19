import type Phaser from 'phaser';
import { COLORS, DEPTH, GAME_WIDTH } from '../config/settings';
import { arcadeString, arcadeText } from './text';

/** Cartel central: "NIVEL 2", "¡PERFECTO!", "GAME OVER"... */
export class Banner {
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly strip: Phaser.GameObjects.Rectangle;

  constructor(private readonly scene: Phaser.Scene) {
    const y = 300;
    this.strip = scene.add.rectangle(GAME_WIDTH / 2, y + 20, GAME_WIDTH, 150, COLORS.panel, 0.6).setDepth(DEPTH.banner);
    this.title = arcadeText(scene, GAME_WIDTH / 2, y, '', 48, { color: COLORS.goldText }).setDepth(DEPTH.banner);
    this.subtitle = arcadeText(scene, GAME_WIDTH / 2, y + 60, '', 18).setDepth(DEPTH.banner);
    this.hide();
  }

  show(title: string, subtitle = '', durationMs = 1500, color: string = COLORS.goldText): void {
    const targets = [this.title, this.subtitle, this.strip];
    this.scene.tweens.killTweensOf(targets);
    this.title.setText(arcadeString(title)).setColor(color);
    this.subtitle.setText(arcadeString(subtitle));
    targets.forEach((t) => t.setVisible(true).setAlpha(1));
    this.title.setScale(0.3);
    this.scene.tweens.add({ targets: this.title, scale: 1, duration: 260, ease: 'Back.easeOut' });
    if (durationMs > 0) {
      this.scene.tweens.add({
        targets,
        alpha: 0,
        delay: durationMs,
        duration: 250,
        onComplete: () => this.hide(),
      });
    }
  }

  hide(): void {
    [this.title, this.subtitle, this.strip].forEach((t) => t.setVisible(false));
  }
}
