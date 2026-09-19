import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/settings';
import { getServices } from '../config/services';
import { ArcadeButton, enableKeyboardMenu } from '../ui/ArcadeButton';
import { arcadeText } from '../ui/text';
import { SCENES } from './keys';

/** Superposición de pausa encima de GameScene. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.pause);
  }

  create(): void {
    this.input.setDefaultCursor('default');
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive();
    arcadeText(this, GAME_WIDTH / 2, 220, 'PAUSA', 48, { color: COLORS.goldText });

    const resume = () => {
      this.scene.stop();
      this.scene.resume(SCENES.game);
    };
    const toMenu = () => {
      getServices(this).audio.stopSoundtrack();
      this.scene.stop(SCENES.game);
      this.scene.start(SCENES.menu);
    };
    const buttons = [
      new ArcadeButton(this, GAME_WIDTH / 2, 350, 'CONTINUAR', resume),
      new ArcadeButton(this, GAME_WIDTH / 2, 430, 'MENÚ', toMenu),
    ];
    enableKeyboardMenu(this, buttons);
    this.input.keyboard?.on('keydown-P', resume);
    this.input.keyboard?.on('keydown-ESC', resume);
  }
}
