import Phaser from 'phaser';
import { IMAGES } from '../config/assetManifest';
import { COLORS, DEPTH, GAME_HEIGHT, GAME_WIDTH, WORLD } from '../config/settings';
import { randomRange } from '../utils/gameUtils';

interface Cloud {
  image: Phaser.GameObjects.Image;
  speed: number;
}

const SKY_BANDS = 12;
const CLOUD_COUNT = 5;

/**
 * Escenario natural retro: cielo por bandas, nubes a la deriva, montañas,
 * laguna, árboles y pasto delantero donde se esconden los gallinazos.
 * Todo es estático salvo las nubes (un único bucle barato por frame).
 */
export class Background {
  private readonly clouds: Cloud[] = [];

  constructor(scene: Phaser.Scene) {
    this.drawSky(scene);

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const image = scene.add
        .image((GAME_WIDTH / CLOUD_COUNT) * i + randomRange(0, 160), randomRange(90, 330), i % 2 ? 'cloudA' : 'cloudB')
        .setDepth(DEPTH.clouds)
        .setAlpha(0.95);
      this.clouds.push({ image, speed: randomRange(6, 16) });
    }

    const mountains = IMAGES.mountainStrip;
    scene.add
      .tileSprite(0, WORLD.horizonY + 40, GAME_WIDTH, mountains.height, 'mountainStrip')
      .setOrigin(0, 1)
      .setDepth(DEPTH.mountains);

    // Campo entre el horizonte y el pasto delantero
    scene.add
      .rectangle(0, WORLD.horizonY + 36, GAME_WIDTH, GAME_HEIGHT - WORLD.horizonY, COLORS.field)
      .setOrigin(0, 0)
      .setDepth(DEPTH.mountains);

    scene.add.image(780, WORLD.grassTopY + 18, 'lake').setOrigin(0.5, 1).setScale(2, 1).setDepth(DEPTH.midground);
    scene.add.image(60, WORLD.grassTopY + 20, 'tree').setOrigin(0.5, 1).setDepth(DEPTH.midground);
    // Choza a la derecha (antes había un árbol)
    scene.add.image(1145, WORLD.grassTopY + 22, 'hut').setOrigin(0.5, 1).setDepth(DEPTH.midground);
    scene.add.image(560, WORLD.grassTopY + 10, 'fence').setOrigin(0.5, 1).setDepth(DEPTH.midground);
    scene.add.image(470, WORLD.grassTopY + 8, 'sign').setOrigin(0.5, 1).setDepth(DEPTH.midground);

    const grass = IMAGES.grassStrip;
    scene.add
      .tileSprite(0, GAME_HEIGHT, GAME_WIDTH, grass.height, 'grassStrip')
      .setOrigin(0, 1)
      .setDepth(DEPTH.foreground);

    for (const x of [360, 930]) {
      scene.add.image(x, WORLD.grassTopY + 44, 'bush').setOrigin(0.5, 1).setDepth(DEPTH.bushes);
    }
    for (const x of [230, 640, 1080]) {
      scene.add.image(x, GAME_HEIGHT - 8, 'grassTuft').setOrigin(0.5, 1).setDepth(DEPTH.bushes);
    }
  }

  update(delta: number): void {
    const dt = delta / 1000;
    for (const cloud of this.clouds) {
      cloud.image.x -= cloud.speed * dt;
      if (cloud.image.x < -cloud.image.width) {
        cloud.image.x = GAME_WIDTH + cloud.image.width;
        cloud.image.y = randomRange(90, 330);
      }
    }
  }

  private drawSky(scene: Phaser.Scene): void {
    const g = scene.add.graphics().setDepth(DEPTH.sky);
    const top = Phaser.Display.Color.ValueToColor(COLORS.skyTop);
    const bottom = Phaser.Display.Color.ValueToColor(COLORS.skyBottom);
    const bandH = Math.ceil((WORLD.horizonY + 40) / SKY_BANDS);
    for (let i = 0; i < SKY_BANDS; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, SKY_BANDS - 1, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, i * bandH, GAME_WIDTH, bandH + 1);
    }
  }
}
