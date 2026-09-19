import type Phaser from 'phaser';
import { DEPTH, GAME_WIDTH } from '../config/settings';
import { clamp } from '../utils/gameUtils';
import { arcadeString, arcadeText } from './text';

const POOL_SIZE = 10;

/** Textos flotantes (+100, HEADSHOT, COMBO...) reutilizados desde un pool. */
export class FloatingTextPool {
  private readonly items: Phaser.GameObjects.Text[] = [];
  private cursor = 0;

  constructor(private readonly scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.items.push(arcadeText(scene, 0, 0, '', 18).setDepth(DEPTH.fx + 1).setVisible(false));
    }
  }

  show(x: number, y: number, text: string, color = '#ffffff', size = 18, rise = 60): void {
    const item = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    this.scene.tweens.killTweensOf(item);
    item
      .setText(arcadeString(text))
      .setFontSize(size)
      .setColor(color)
      .setPosition(clamp(x, 120, GAME_WIDTH - 120), y)
      .setAlpha(1)
      .setScale(0.6)
      .setVisible(true);
    this.scene.tweens.add({ targets: item, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.scene.tweens.add({
      targets: item,
      y: y - rise,
      alpha: 0,
      delay: 350,
      duration: 650,
      onComplete: () => item.setVisible(false),
    });
  }
}
