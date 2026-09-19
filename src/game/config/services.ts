import type Phaser from 'phaser';
import type { ScoreRepository } from '@/services/scores/ScoreRepository';
import type { GameBridge } from '../bridge/GameBridge';
import type { AudioSystem } from '../systems/AudioSystem';

/** Servicios inyectados en el registry del juego al crearlo. */
export interface GameServices {
  bridge: GameBridge;
  scores: ScoreRepository;
  audio: AudioSystem;
  fontFamily: string;
}

const KEY = 'services';

export function setServices(game: Phaser.Game, services: GameServices): void {
  game.registry.set(KEY, services);
}

export function getServices(scene: Phaser.Scene): GameServices {
  const services = scene.registry.get(KEY) as GameServices | undefined;
  if (!services) throw new Error('GameServices no registrados');
  return services;
}
