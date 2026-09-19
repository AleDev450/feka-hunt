import Phaser from 'phaser';
import { ANIM } from '../config/animations';
import { COLORS, CREDITS, DEPTH, GAME_WIDTH, WORLD } from '../config/settings';
import { getServices } from '../config/services';
import { Dog } from '../entities/Dog';
import { FriendsGroup } from '../entities/FriendsGroup';
import { Hunter } from '../entities/Hunter';
import { ArcadeButton, enableKeyboardMenu } from '../ui/ArcadeButton';
import { arcadeText } from '../ui/text';
import { loadRecord, padScore } from '../utils/gameUtils';
import { Background } from '../world/Background';
import { SCENES } from './keys';

interface Flyer {
  sprite: Phaser.GameObjects.Sprite;
  speed: number;
}

export class MenuScene extends Phaser.Scene {
  private background!: Background;
  private flyers: Flyer[] = [];

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    const { audio } = getServices(this);
    this.input.setDefaultCursor('default');
    this.background = new Background(this);
    new Hunter(this);
    new Dog(this, audio);
    new FriendsGroup(this);
    this.add.image(1090, WORLD.grassTopY + 12, 'vulturePerched').setOrigin(0.5, 1).setDepth(DEPTH.midground + 1);

    // Gallinazos decorativos cruzando el cielo
    this.flyers = [0, 1].map((i) => {
      const sprite = this.add
        .sprite(-100 - i * 500, 230 + i * 120, 'vulture')
        .setDepth(DEPTH.vultures)
        .setAlpha(0.9)
        .play(ANIM.vultureFly);
      return { sprite, speed: 110 + i * 40 };
    });

    const logo = this.add.image(GAME_WIDTH / 2, 150, 'logo').setDepth(DEPTH.hud);
    this.tweens.add({ targets: logo, y: 158, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const record = loadRecord();
    arcadeText(this, GAME_WIDTH / 2, 262, `RÉCORD ${padScore(record)}`, 16, { color: COLORS.goldText }).setDepth(DEPTH.hud);

    const start = () => this.scene.start(SCENES.game);
    const buttons = [
      new ArcadeButton(this, GAME_WIDTH / 2, 345, 'INICIAR', start),
      new ArcadeButton(this, GAME_WIDTH / 2, 425, 'CÓMO JUGAR', () => this.scene.start(SCENES.howToPlay)),
      new ArcadeButton(this, GAME_WIDTH / 2, 505, 'RANKING', () => this.scene.start(SCENES.ranking)),
    ];
    buttons.forEach((b) => b.setDepth(DEPTH.hud));
    enableKeyboardMenu(this, buttons);
    this.input.keyboard?.once('keydown-SPACE', start);

    // Créditos del soundtrack con enlace al video original
    const credit = new ArcadeButton(
      this,
      GAME_WIDTH / 2,
      592,
      `SOUNDTRACK: ${CREDITS.artist} · VER VIDEO`,
      () => window.open(CREDITS.videoUrl, '_blank', 'noopener,noreferrer'),
      { width: 640, height: 46, fontSize: 12, color: COLORS.red },
    );
    credit.setDepth(DEPTH.hud);
    this.tweens.add({ targets: credit, scale: 1.04, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
