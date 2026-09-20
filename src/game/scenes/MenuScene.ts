import Phaser from 'phaser';
import { IMAGES } from '../config/assetManifest';
import { VULTURE_TYPES, vultureFlyAnim } from '../config/animations';
import { COLORS, DEPTH, GAME_WIDTH, WORLD } from '../config/settings';
import { Jacinto } from '../entities/Jacinto';
import { FriendsGroup } from '../entities/FriendsGroup';
import { Hunter } from '../entities/Hunter';
import { ArcadeButton, enableKeyboardMenu } from '../ui/ArcadeButton';
import { arcadeText } from '../ui/text';
import { loadRecord, padScore } from '../utils/gameUtils';
import { Background } from '../world/Background';
import { SCENES } from './keys';

interface Flyer { sprite: Phaser.GameObjects.Sprite; speed: number; }

export class MenuScene extends Phaser.Scene {
  private background!: Background;
  private flyers: Flyer[] = [];

  constructor() { super(SCENES.menu); }

  create(): void {
    this.input.setDefaultCursor('default');
    this.background = new Background(this);
    new Hunter(this);
    new Jacinto(this);
    new FriendsGroup(this);
    this.add.image(WORLD.hut.x, WORLD.hut.y - IMAGES.hut.height + WORLD.hut.roofOffsetY, 'vulturePerched')
      .setOrigin(0.5, 1).setDepth(DEPTH.midground + 1);

    this.flyers = [0, 1].map((i) => {
      const sprite = this.add.sprite(-100 - i * 500, 230 + i * 120, 'vulture')
        .setDepth(DEPTH.vultures).setAlpha(0.9)
        .play(vultureFlyAnim(VULTURE_TYPES[i % VULTURE_TYPES.length]));
      return { sprite, speed: 110 + i * 40 };
    });

    const logo = this.add.image(GAME_WIDTH / 2, 150, 'logo').setDepth(DEPTH.hud);
    this.tweens.add({ targets: logo, y: 158, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const record = loadRecord();
    arcadeText(this, GAME_WIDTH / 2, 262, `RÉCORD ${padScore(record)}`, 16, { color: COLORS.goldText }).setDepth(DEPTH.hud);

    const start = () => this.scene.start(SCENES.game);
    const buttons = [
      new ArcadeButton(this, GAME_WIDTH / 2, 330, 'INICIAR', start),
      new ArcadeButton(this, GAME_WIDTH / 2, 430, 'RANKING', () => this.scene.start(SCENES.ranking)),
      new ArcadeButton(this, GAME_WIDTH / 2, 530, 'JUGAR FEKA GAMES', () => { window.location.href = '/'; }, { width: 480, fontSize: 16 }),
    ];
    buttons.forEach((b) => b.setDepth(DEPTH.hud));
    enableKeyboardMenu(this, buttons);
    this.input.keyboard?.once('keydown-SPACE', start);

    arcadeText(this, GAME_WIDTH / 2 - 115, 625, 'DESARROLLADO POR', 12, { color: COLORS.white })
      .setDepth(DEPTH.hud).setStroke('#1a0f1a', 5).setAlpha(0.98);
    this.add.image(GAME_WIDTH / 2 + 115, 625, 'kickLogo').setScale(0.62).setDepth(DEPTH.hud);
  }

  update(_time: number, delta: number): void {
    this.background.update(delta);
    const dt = delta / 1000;
    for (const flyer of this.flyers) {
      flyer.sprite.x += flyer.speed * dt;
      flyer.sprite.y += Math.sin(flyer.sprite.x / 60) * 0.6;
      if (flyer.sprite.x > GAME_WIDTH + 120) flyer.sprite.x = -120;
    }
  }
}
