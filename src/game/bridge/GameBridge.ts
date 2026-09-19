import type { GameResult } from '@/types/game';

/**
 * Canal explícito de comunicación entre React y Phaser.
 * No depende de Phaser, así React puede usarlo sin cargar el motor.
 */
export interface BridgeEvents {
  /** Juego → web */
  'game:ready': void;
  'game:start': void;
  'game:over': GameResult;
  'game:paused': void;
  'game:resumed': void;
  /** Web → juego */
  'control:pause': void;
  'control:resume': void;
}

type Listener<T> = (payload: T) => void;

export class GameBridge {
  private listeners: { [K in keyof BridgeEvents]?: Set<Listener<BridgeEvents[K]>> } = {};

  on<K extends keyof BridgeEvents>(event: K, listener: Listener<BridgeEvents[K]>): () => void {
    const listeners = this.listeners as Record<string, Set<Listener<unknown>> | undefined>;
    const set = (listeners[event] ??= new Set()) as Set<Listener<BridgeEvents[K]>>;
    set.add(listener);
    return () => set.delete(listener);
  }

  emit<K extends keyof BridgeEvents>(event: K, ...payload: BridgeEvents[K] extends void ? [] : [BridgeEvents[K]]): void {
    const set = this.listeners[event] as Set<Listener<BridgeEvents[K]>> | undefined;
    set?.forEach((listener) => listener(payload[0] as BridgeEvents[K]));
  }

  clear(): void {
    this.listeners = {};
  }
}
