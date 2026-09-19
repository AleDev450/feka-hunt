import type Phaser from 'phaser';
import { TIMING } from '../config/settings';
import { Vulture, type VultureOutcome } from '../entities/Vulture';
import { pick } from '../utils/gameUtils';
import type { DifficultyParams } from './DifficultySystem';

export interface SpawnHandlers {
  onResolved(vulture: Vulture, outcome: VultureOutcome): void;
  onFlee(vulture: Vulture): void;
  onLanded(vulture: Vulture): void;
  onFlightComplete(): void;
}

/**
 * Crea las tandas ("flights") de gallinazos reutilizando sprites de un pool.
 */
export class SpawnSystem {
  private readonly pool: Vulture[] = [];
  private readonly inPlay = new Set<Vulture>();
  private pendingSpawns = 0;
  private fleeOnSpawn = false;
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: SpawnHandlers,
  ) {}

  get hittable(): Vulture[] {
    return [...this.inPlay].filter((v) => v.isHittable);
  }

  get isFlightActive(): boolean {
    return this.pendingSpawns > 0 || this.inPlay.size > 0;
  }

  startFlight(params: DifficultyParams, count: number): void {
    this.pendingSpawns = count;
    this.fleeOnSpawn = false;
    this.timers = [];
    for (let i = 0; i < count; i++) {
      const timer = this.scene.time.delayedCall(i * TIMING.staggerSpawnMs, () => {
        this.pendingSpawns--;
        const vulture = this.acquire();
        this.inPlay.add(vulture);
        vulture.spawn(params, pick(params.spawnSides), pick(params.patterns), i, count);
        if (this.fleeOnSpawn && vulture.flee()) this.handlers.onFlee(vulture);
      });
      this.timers.push(timer);
    }
  }

  /** Todos los gallinazos que aún vuelan escapan (p. ej. sin munición). */
  fleeAll(): void {
    this.inPlay.forEach((v) => {
      if (v.flee()) this.handlers.onFlee(v);
    });
    // Los que aún no aparecieron saldrán huyendo directamente
    this.fleeOnSpawn = true;
  }

  reset(): void {
    this.timers.forEach((t) => t.remove());
    this.timers = [];
    this.pendingSpawns = 0;
    this.fleeOnSpawn = false;
    // Al cerrar la escena los sprites ya pueden estar destruidos (sin `scene`)
    this.inPlay.forEach((v) => {
      if (v.scene) v.deactivate();
    });
    this.inPlay.clear();
  }

  private acquire(): Vulture {
    const free = this.pool.find((v) => !v.active && !this.inPlay.has(v));
    if (free) return free;
    const vulture = new Vulture(this.scene);
    this.scene.add.existing(vulture);
    vulture.onResolved = (v, outcome) => this.release(v, outcome);
    vulture.on('flee', (v: Vulture) => this.handlers.onFlee(v));
    vulture.on('landed', (v: Vulture) => this.handlers.onLanded(v));
    this.pool.push(vulture);
    return vulture;
  }

  private release(vulture: Vulture, outcome: VultureOutcome): void {
    this.inPlay.delete(vulture);
    this.handlers.onResolved(vulture, outcome);
    if (!this.isFlightActive) this.handlers.onFlightComplete();
  }
}
