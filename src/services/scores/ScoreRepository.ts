import type { LeaderboardQuery, ScoreEntry, ScoreSubmission } from '@/types/game';

/**
 * Abstracción de persistencia de puntuaciones.
 * El juego solo conoce esta interfaz; la implementación (local o Supabase)
 * se inyecta desde la web al crear el juego.
 */
export interface ScoreRepository {
  /** 'local' | 'online' — se muestra en la pantalla de ranking. */
  readonly source: 'local' | 'online';
  submit(submission: ScoreSubmission): Promise<ScoreEntry>;
  getLeaderboard(query: LeaderboardQuery): Promise<ScoreEntry[]>;
}

/** Fecha mínima (ISO) para un periodo del ranking. */
export function periodStart(period: LeaderboardQuery['period'], now = new Date()): string | null {
  if (period === 'all') return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'weekly') {
    // Semana empezando el lunes
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
  }
  return start.toISOString();
}

export function sanitizePlayerName(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚ ]/g, '').trim().slice(0, 12);
  return clean || 'PLAYER';
}
