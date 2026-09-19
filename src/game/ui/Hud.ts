import Phaser from 'phaser';
import { COLORS, DEPTH, GAME_HEIGHT, PLAYER, VICTORY } from '../config/settings';
import { padScore } from '../utils/gameUtils';
import { TEX } from './proceduralTextures';
import { arcadeText } from './text';

export type TrackerSlot = 'pending' | 'killed' | 'escaped';

export interface HudCallbacks {
  onPause: () => void;
  onToggleMute: () => boolean;
}

const TOP_Y = 10;
const TOP_H = 70;
const BOTTOM_H = 56;
const BOTTOM_Y = GAME_HEIGHT - BOTTOM_H - 6;

/**
 * HUD del gameplay. Arriba: jugador/vidas, score, récord, nivel/combo y
 * botones. Abajo (sobre el pasto, fuera de la zona de vuelo): munición y
 * gallinazos del nivel.
 */
export class Hud {
  /** Objetos interactivos del HUD: un click sobre ellos no dispara */
  readonly interactive: Phaser.GameObjects.GameObject[] = [];
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly recordText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly shells: Phaser.GameObjects.Image[] = [];
  private readonly ammoCount: Phaser.GameObjects.Text;
  private readonly tracker: Phaser.GameObjects.Image[] = [];
  private readonly trackerX: number;
  private readonly muteIcon: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    callbacks: HudCallbacks,
  ) {
    const layer = scene.add.container(0, 0).setDepth(DEPTH.hud);
    const panels = scene.add.graphics();
    layer.add(panels);
    const panel = (x: number, y: number, w: number, h: number, border: number) => {
      panels.fillStyle(COLORS.panel, 0.72);
      panels.fillRoundedRect(x, y, w, h, 8);
      panels.lineStyle(3, border, 1);
      panels.strokeRoundedRect(x, y, w, h, 8);
    };
    const label = (x: number, y: number, text: string, color: string = COLORS.goldText, size = 11) => {
      const t = arcadeText(scene, x, y, text, size, { color });
      layer.add(t);
      return t;
    };

    // Jugador + vidas
    panel(12, TOP_Y, 300, TOP_H, COLORS.gold);
    layer.add(scene.add.image(20, TOP_Y + TOP_H / 2, 'portrait').setOrigin(0, 0.5));
    label(84, TOP_Y + 18, 'P1', COLORS.redText, 16).setOrigin(0, 0.5);
    label(130, TOP_Y + 18, 'VIDAS', COLORS.white, 11).setOrigin(0, 0.5);
    for (let i = 0; i < PLAYER.maxLives; i++) {
      const heart = scene.add.image(86 + i * 32, TOP_Y + 48, TEX.heart).setOrigin(0, 0.5);
      this.hearts.push(heart);
      layer.add(heart);
    }

    // Score y récord
    panel(326, TOP_Y, 214, TOP_H, COLORS.blue);
    label(433, TOP_Y + 16, 'SCORE');
    this.scoreText = label(433, TOP_Y + 46, '000000', COLORS.white, 22);
    panel(552, TOP_Y, 214, TOP_H, COLORS.blue);
    label(659, TOP_Y + 16, 'RÉCORD');
    this.recordText = label(659, TOP_Y + 46, '000000', COLORS.white, 22);

    // Nivel actual / total y combo
    panel(778, TOP_Y, 300, TOP_H, COLORS.gold);
    label(862, TOP_Y + 16, 'NIVEL');
    this.levelText = label(862, TOP_Y + 46, '1/1', COLORS.white, 20);
    label(1006, TOP_Y + 16, 'COMBO');
    this.comboText = label(1006, TOP_Y + 46, 'x1', COLORS.white, 22);

    // Botones: pausa y sonido
    const pause = this.iconButton(1112, callbacks.onPause);
    const pauseIcon = scene.add.graphics();
    pauseIcon.fillStyle(0xffffff, 1).fillRect(-10, -13, 7, 26).fillRect(4, -13, 7, 26);
    pause.add(pauseIcon);
    this.muteIcon = scene.add.graphics();
    const mute = this.iconButton(1200, () => this.drawMuteIcon(callbacks.onToggleMute()));
    mute.add(this.muteIcon);
    layer.add([pause, mute]);

    // Munición
    const ammoX = 262;
    panel(ammoX, BOTTOM_Y, 300, BOTTOM_H, COLORS.green);
    layer.add(scene.add.image(ammoX + 48, BOTTOM_Y + BOTTOM_H / 2, 'shotgun'));
    for (let i = 0; i < PLAYER.magazineSize; i++) {
      const shell = scene.add.image(ammoX + 104 + i * 25, BOTTOM_Y + BOTTOM_H / 2, 'shell');
      this.shells.push(shell);
      layer.add(shell);
    }
    this.ammoCount = label(ammoX + 262, BOTTOM_Y + BOTTOM_H / 2 + 2, 'x0', COLORS.white, 16);

    // Gallinazos del nivel
    this.trackerX = 578;
    panel(this.trackerX, BOTTOM_Y, 330, BOTTOM_H, COLORS.blue);

    this.setRecord(0);
  }

  setScore(score: number): void {
    this.scoreText.setText(padScore(score));
  }

  setRecord(record: number): void {
    this.recordText.setText(padScore(record));
  }

  setLevel(level: number): void {
    this.levelText.setText(`${level}/${VICTORY.levels}`);
  }

  setCombo(multiplier: number, combo: number): void {
    this.comboText.setText(`x${multiplier}`);
    this.comboText.setColor(multiplier > 1 ? COLORS.redText : COLORS.white);
    if (combo > 0 && multiplier > 1) {
      this.scene.tweens.add({ targets: this.comboText, scale: 1.3, duration: 90, yoyo: true });
    }
  }

  setLives(lives: number): void {
    this.hearts.forEach((heart, i) => {
      heart.setTexture(i < lives ? TEX.heart : TEX.heartEmpty);
      heart.setVisible(i < Math.max(lives, PLAYER.lives));
    });
  }

  setAmmo(ammo: number, capacity: number): void {
    this.shells.forEach((shell, i) => {
      shell.setVisible(i < capacity);
      shell.setAlpha(i < ammo ? 1 : 0.22);
    });
    this.ammoCount.setText(`x${ammo}`);
    this.ammoCount.setColor(ammo === 0 ? COLORS.redText : COLORS.white);
  }

  setTracker(slots: TrackerSlot[]): void {
    const spacing = 36;
    const startX = this.trackerX + 165 - ((slots.length - 1) * spacing) / 2;
    slots.forEach((slot, i) => {
      let icon = this.tracker[i];
      if (!icon) {
        icon = this.scene.add.image(0, BOTTOM_Y + BOTTOM_H / 2, 'iconVultureEmpty').setDepth(DEPTH.hud + 1);
        this.tracker[i] = icon;
      }
      icon.setPosition(startX + i * spacing, BOTTOM_Y + BOTTOM_H / 2).setVisible(true);
      icon.setTexture(slot === 'killed' ? 'iconVulture' : 'iconVultureEmpty');
      // El icono vacío es un contorno oscuro: se pinta con FILL para que se lea sobre el panel
      if (slot === 'killed') icon.setTintMode(Phaser.TintModes.MULTIPLY).clearTint();
      else icon.setTint(slot === 'escaped' ? COLORS.red : 0x8a90b0).setTintMode(Phaser.TintModes.FILL);
    });
    this.tracker.slice(slots.length).forEach((icon) => icon.setVisible(false));
  }

  private iconButton(x: number, onClick: () => void): Phaser.GameObjects.Container {
    const size = 60;
    const button = this.scene.add.container(x + size / 2, TOP_Y + TOP_H / 2);
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.panel, 0.72).fillRoundedRect(-size / 2, -size / 2, size, size, 8);
    bg.lineStyle(3, COLORS.gold, 1).strokeRoundedRect(-size / 2, -size / 2, size, size, 8);
    button.add(bg);
    button.setSize(size, size).setInteractive({ useHandCursor: true });
    button.on('pointerup', onClick);
    this.interactive.push(button);
    return button;
  }

  drawMuteIcon(muted: boolean): void {
    const g = this.muteIcon;
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(-14, -6, 8, 12);
    g.fillTriangle(-6, -6, 4, -14, 4, 14);
    g.fillRect(-6, -6, 10, 12);
    g.lineStyle(3, muted ? COLORS.red : 0xffffff, 1);
    if (muted) {
      g.lineBetween(8, -8, 18, 8);
      g.lineBetween(18, -8, 8, 8);
    } else {
      g.lineBetween(9, -5, 9, 5);
      g.lineBetween(15, -10, 15, 10);
    }
  }
}
