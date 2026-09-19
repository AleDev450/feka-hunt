import Phaser from 'phaser';
import { COLORS } from '../config/settings';
import { getServices } from '../config/services';
import { arcadeText } from './text';

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789';
const SLOT_W = 64;

/**
 * Entrada de iniciales estilo arcade (3 letras). Se maneja con flechas
 * táctiles ▲▼ o escribiendo con el teclado.
 */
export class InitialsInput extends Phaser.GameObjects.Container {
  private readonly letters: number[];
  private readonly texts: Phaser.GameObjects.Text[] = [];
  private readonly cursorBox: Phaser.GameObjects.Rectangle;
  private activeSlot = 0;
  private enabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number, initial: string, length = 3) {
    super(scene, x, y);
    const chars = initial.toUpperCase().padEnd(length, 'A').slice(0, length);
    this.letters = [...chars].map((c) => Math.max(0, ALPHABET.indexOf(c)));
    const startX = -((length - 1) * SLOT_W) / 2;

    this.cursorBox = scene.add.rectangle(startX, 0, SLOT_W - 8, 56, COLORS.gold, 0.25).setStrokeStyle(3, COLORS.gold);
    this.add(this.cursorBox);

    for (let i = 0; i < length; i++) {
      const sx = startX + i * SLOT_W;
      const text = arcadeText(scene, sx, 2, '', 32);
      this.texts.push(text);
      this.add(text);
      this.add(this.arrow(sx, -52, -1, i));
      this.add(this.arrow(sx, 52, 1, i));
      const zone = scene.add.zone(sx, 0, SLOT_W - 8, 56).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this.select(i));
      this.add(zone);
    }

    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.onKey(event));
    this.refresh();
    scene.add.existing(this);
  }

  get value(): string {
    return this.letters.map((i) => ALPHABET[i]).join('');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.6);
    this.cursorBox.setVisible(enabled);
  }

  private arrow(x: number, y: number, dir: 1 | -1, slot: number): Phaser.GameObjects.GameObject {
    const tri = this.scene.add.triangle(x, y, 0, dir < 0 ? 20 : 0, 28, dir < 0 ? 20 : 0, 14, dir < 0 ? 0 : 20, COLORS.gold);
    tri.setInteractive({ useHandCursor: true });
    tri.on('pointerup', () => {
      this.select(slot);
      this.change(dir);
    });
    return tri;
  }

  private select(slot: number): void {
    if (!this.enabled) return;
    this.activeSlot = slot;
    this.refresh();
  }

  private change(delta: number): void {
    if (!this.enabled) return;
    const n = ALPHABET.length;
    this.letters[this.activeSlot] = (this.letters[this.activeSlot] + delta + n) % n;
    getServices(this.scene).audio.play('button');
    this.refresh();
  }

  private onKey(event: KeyboardEvent): void {
    if (!this.enabled) return;
    const key = event.key.toUpperCase();
    if (key === 'ARROWUP') this.change(-1);
    else if (key === 'ARROWDOWN') this.change(1);
    else if (key === 'ARROWLEFT' || key === 'BACKSPACE') this.select(Math.max(0, this.activeSlot - 1));
    else if (key === 'ARROWRIGHT') this.select(Math.min(this.letters.length - 1, this.activeSlot + 1));
    else if (key.length === 1 && ALPHABET.includes(key)) {
      this.letters[this.activeSlot] = ALPHABET.indexOf(key);
      this.activeSlot = Math.min(this.letters.length - 1, this.activeSlot + 1);
      this.refresh();
    }
  }

  private refresh(): void {
    this.texts.forEach((t, i) => {
      t.setText(ALPHABET[this.letters[i]]);
      t.setColor(i === this.activeSlot ? COLORS.goldText : COLORS.white);
    });
    this.cursorBox.setX(this.texts[this.activeSlot].x);
  }
}
