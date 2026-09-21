import Phaser from 'phaser';
import { CONFIG } from './config';
import { LoadScene, MenuScene, HelpScene, ResultsScene, RankingScene } from './scenes/Screens';
import { DriveScene } from './scenes/DriveScene';
import { Sound } from './systems/Sound';

export function createCholoGame(parent: HTMLElement): { destroy(): void } {
  const sound = new Sound();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: CONFIG.width,
    height: CONFIG.height,
    backgroundColor: '#111723',
    render: { antialias: true, pixelArt: false },
    audio: { noAudio: true }, // This game synthesizes effects through its own Web Audio system.
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 4 },
    scene: [LoadScene, MenuScene, HelpScene, DriveScene, ResultsScene, RankingScene],
    callbacks: { preBoot: (instance) => instance.registry.set('audio', sound) },
  });
  return { destroy() { sound.destroy(); game.destroy(true); } };
}
