import { DIFFICULTY, PLAYER, VICTORY, type FlightPattern, type SpawnSide } from '../config/settings';

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
  /** Valor en el nivel 1 */
  start: number;
  /** Valor en el último nivel */
  end: number;
  /** >1 = sube despacio al principio y se endurece al final */
  curve: number;
}

/** Interpola de `start` (nivel 1) a `end` (último nivel) siguiendo la curva. */
const ramp = (r: Ramp, level: number): number => {
  const t = Math.min(1, Math.max(0, (level - 1) / (VICTORY.levels - 1)));
  return r.start + (r.end - r.start) * Math.pow(t, r.curve);
};

const unlocked = <T extends { fromLevel: number; toLevel?: number }>(items: readonly T[], level: number): T[] =>
  items.filter((item) => level >= item.fromLevel && level <= (item.toLevel ?? Infinity));

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
