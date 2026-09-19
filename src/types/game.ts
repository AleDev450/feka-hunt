/** Tipos compartidos entre la web (React/Next) y el juego (Phaser). */

/** Resultado de una partida terminada. Se envía una sola vez al final. */
export interface GameResult {
  /** true si llegó vivo al final de la canción (soundtrack) */
  won: boolean;
  score: number;
  level: number;
  shots: number;
  hits: number;
  headshots: number;
  /** 0..1 */
  accuracy: number;
  maxCombo: number;
  durationMs: number;
}

/** Una entrada del ranking (equivale conceptualmente a la tabla `scores`). */
export interface ScoreEntry {
  id: string;
  playerName: string;
  userId: string | null;
  score: number;
  level: number;
  accuracy: number;
  shots: number;
  hits: number;
  combo: number;
  eventId: string | null;
  seasonId: string | null;
  createdAt: string;
}

export type LeaderboardPeriod = 'all' | 'daily' | 'weekly';

export interface LeaderboardQuery {
  period: LeaderboardPeriod;
  limit: number;
  eventId?: string;
  seasonId?: string;
}

export interface ScoreSubmission {
  playerName: string;
  result: GameResult;
  eventId?: string;
  seasonId?: string;
}
