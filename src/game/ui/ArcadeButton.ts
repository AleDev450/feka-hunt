import Phaser from 'phaser';
import { COLORS } from '../config/settings';
import { getServices } from '../config/services';
import { arcadeText } from './text';

export interface ArcadeButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  color?: number;
}

/** Botón retro: "[ INICIAR ]" con borde dorado, hover y foco por teclado. */
export class ArcadeButton extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly btnW: number;
  private readonly btnH: number;
  private readonly accent: number;
  private focused = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    private readonly onClick: () => void,
    options: ArcadeButtonOptions = {},
  ) {
    super(scene, x, y);
    this.btnW = options.width ?? 380;
    this.btnH = options.height ?? 64;
    this.accent = options.color ?? COLORS.gold;
    this.bg = scene.add.graphics();
    this.label = arcadeText(scene, 0, 2, `[ ${text} ]`, options.fontSize ?? 20);
    this.add([this.bg, this.label]);
    this.setSize(this.btnW, this.btnH);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setFocused(true));
    this.on('pointerout', () => this.setFocused(false));
    this.on('pointerup', () => this.activate());
    this.draw();
    scene.add.existing(this);
  }

  setFocused(focused: boolean): this {
    this.focused = focused;
    this.draw();
    return this;
  }

  activate(): void {
    const { audio } = getServices(this.scene);
    audio.unlock();
    audio.play('button');
    this.scene.tweens.add({ targets: this, scale: 0.94, duration: 60, yoyo: true });
    this.onClick();
  }

  private draw(): void {
    const { btnW: w, btnH: h } = this;
    this.bg.clear();
    this.bg.fillStyle(this.focused ? this.accent : COLORS.panel, this.focused ? 1 : 0.82);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.bg.lineStyle(4, this.accent, 1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.label.setColor(this.focused ? '#1a0f1a' : COLORS.white);
    this.label.setStroke(this.focused ? '#ffe0a0' : COLORS.shadow, this.focused ? 0 : 6);
  }
}

/** Navegación con teclado (↑ ↓ ENTER) entre botones de un menú. */
export function enableKeyboardMenu(scene: Phaser.Scene, buttons: ArcadeButton[], vertical = true): void {
  const keyboard = scene.input.keyboard;
  if (!keyboard || buttons.length === 0) return;
  let index = -1;
  const focus = (i: number) => {
    index = (i + buttons.length) % buttons.length;
    buttons.forEach((b, j) => b.setFocused(j === index));
  };
  const prev = vertical ? 'keydown-UP' : 'keydown-LEFT';
  const next = vertical ? 'keydown-DOWN' : 'keydown-RIGHT';
  keyboard.on(prev, () => focus(index - 1));
  keyboard.on(next, () => focus(index + 1));
  keyboard.on('keydown-ENTER', () => {
    if (index >= 0) buttons[index].activate();
  });
}
