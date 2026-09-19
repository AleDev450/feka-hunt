import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { GameScene } from '../scenes/GameScene';
import { HowToPlayScene } from '../scenes/HowToPlayScene';
import { MenuScene } from '../scenes/MenuScene';
import { PauseScene } from '../scenes/PauseScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { RankingScene } from '../scenes/RankingScene';
import { GAME_HEIGHT, GAME_WIDTH } from './settings';

/**
 * Resolución lógica fija (1280x720) escalada al viewport con FIT.
 * pixelArt + roundPixels mantienen los píxeles nítidos.
 */
export function buildGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0b0b14',
    pixelArt: true,
    roundPixels: true,
    banner: false,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 2,
    },
    fps: { target: 60 },
    scene: [BootScene, PreloadScene, MenuScene, HowToPlayScene, RankingScene, GameScene, PauseScene, GameOverScene],
  };
}
