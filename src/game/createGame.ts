import Phaser from 'phaser';
import type { ScoreRepository } from '@/services/scores/ScoreRepository';
import type { GameBridge } from './bridge/GameBridge';
import { buildGameConfig } from './config/gameConfig';
import { FALLBACK_FONT } from './config/settings';
import { setServices } from './config/services';
import { AudioSystem } from './systems/AudioSystem';

export interface CreateGameOptions {
  parent: HTMLElement;
  bridge: GameBridge;
  scores: ScoreRepository;
  fontFamily?: string;
}

export interface GameHandle {
  game: Phaser.Game;
  destroy(): void;
}

/** Punto de entrada del juego. Solo se importa en el cliente (ver GameCanvas). */
export function createGame({ parent, bridge, scores, fontFamily }: CreateGameOptions): GameHandle {
  const audio = new AudioSystem();
  const game = new Phaser.Game(buildGameConfig(parent));
  setServices(game, { bridge, scores, audio, fontFamily: fontFamily || FALLBACK_FONT });
  game.events.once(Phaser.Core.Events.READY, () => audio.attach(game.sound));

  // Los navegadores exigen un gesto del usuario para activar el audio
  const unlock = () => audio.unlock();
  parent.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // Acceso para depuración en desarrollo (consola del navegador / tests e2e)
  if (process.env.NODE_ENV === 'development') {
    (window as unknown as { __GALLINAZO__?: Phaser.Game }).__GALLINAZO__ = game;
  }

  return {
    game,
    destroy() {
      parent.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      audio.destroy();
      game.destroy(true);
    },
  };
}
