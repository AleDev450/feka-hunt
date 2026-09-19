import Phaser from 'phaser';
import { registerAnimations } from '../config/animations';
import { ASSET_BASE_PATH, IMAGES, SPRITE_SHEETS } from '../config/assetManifest';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/settings';
import { getServices } from '../config/services';
import { AUDIO_FILES, audioCacheKey } from '../systems/AudioSystem';
import { createProceduralTextures } from '../ui/proceduralTextures';
import { arcadeText } from '../ui/text';
import { SCENES } from './keys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  preload(): void {
    const barW = 480;
    const x = (GAME_WIDTH - barW) / 2;
    const y = GAME_HEIGHT / 2 + 20;
    arcadeText(this, GAME_WIDTH / 2, y - 50, 'CARGANDO...', 20, { color: COLORS.goldText });
    const frame = this.add.graphics().lineStyle(4, COLORS.gold).strokeRect(x - 6, y - 6, barW + 12, 36);
    const bar = this.add.graphics();
    this.load.on('progress', (p: number) => {
      bar.clear().fillStyle(COLORS.red).fillRect(x, y, barW * p, 24);
    });
    this.load.once('complete', () => {
      frame.destroy();
      bar.destroy();
    });

    this.load.setPath(ASSET_BASE_PATH);
    for (const [key, sheet] of Object.entries(SPRITE_SHEETS)) {
      this.load.spritesheet(key, sheet.file, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
    }
    for (const [key, image] of Object.entries(IMAGES)) {
      this.load.image(key, image.file);
    }
    this.load.setPath('');
    for (const [key, file] of Object.entries(AUDIO_FILES)) {
      if (file) this.load.audio(audioCacheKey(key as keyof typeof AUDIO_FILES), file);
    }
  }

  create(): void {
    createProceduralTextures(this);
    registerAnimations(this);
    getServices(this).bridge.emit('game:ready');
    this.scene.start(SCENES.menu);
  }
}
