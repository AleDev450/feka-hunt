import { DIFFICULTY, PLAYER, type FlightPattern, type SpawnSide } from '../config/settings';

export interface DifficultyParams {
  level: number;
  /** px/s */
  speed: number;
  speedJitter: number;
  flyTimeMs: number;
  flapFps: number;
  simultaneous: number;
  shotsPerFlight: number;
  patterns: FlightPattern[];
  spawnSides: SpawnSide[];
  turnIntervalMs: number;
  waveAmplitude: number;
  vulturesPerLevel: number;
}

interface Ramp {
  base: number;
  perLevel: number;
  max?: number;
  min?: number;
}

const ramp = (r: Ramp, level: number): number => {
  const value = r.base + r.perLevel * (level - 1);
  if (r.max !== undefined) return Math.min(r.max, value);
  if (r.min !== undefined) return Math.max(r.min, value);
  return value;
};

const unlocked = <T extends { fromLevel: number }>(items: readonly T[], level: number): T[] =>
  items.filter((item) => level >= item.fromLevel);

/** Única fuente de verdad de la dificultad por nivel. */
export const DifficultySystem = {
  forLevel(level: number): DifficultyParams {
    const simultaneous = unlocked(DIFFICULTY.simultaneous, level).at(-1)?.count ?? 1;
    const shotsPerFlight = Math.min(
      PLAYER.magazineSize,
      DIFFICULTY.shots.base + DIFFICULTY.shots.perExtraVulture * (simultaneous - 1),
    );
    return {
      level,
      speed: ramp(DIFFICULTY.speed, level),
      speedJitter: DIFFICULTY.speed.jitter,
      flyTimeMs: ramp(DIFFICULTY.flyTimeMs, level),
      flapFps: ramp(DIFFICULTY.flapFps, level),
      simultaneous,
      shotsPerFlight,
      patterns: unlocked(DIFFICULTY.patterns, level).map((p) => p.pattern),
      spawnSides: unlocked(DIFFICULTY.spawnSides, level).map((s) => s.side),
      turnIntervalMs: ramp(DIFFICULTY.turnIntervalMs, level),
      waveAmplitude: ramp(DIFFICULTY.waveAmplitude, level),
      vulturesPerLevel: DIFFICULTY.vulturesPerLevel,
    };
  },
};
