import type { LeaderboardQuery, ScoreEntry, ScoreSubmission } from '@/types/game';
import { periodStart, sanitizePlayerName, type ScoreRepository } from './ScoreRepository';

const MAX_STORED = 200;

/** Ranking guardado en el navegador. Se usa mientras no haya Supabase configurado. */
export class LocalScoreRepository implements ScoreRepository {
  readonly source = 'local' as const;

  constructor(private readonly gameId = 'gallinazo-hunt') {}

  async submit({ playerName, result, eventId, seasonId }: ScoreSubmission): Promise<ScoreEntry> {
    const entry: ScoreEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
      playerName: sanitizePlayerName(playerName),
      userId: null,
      score: result.score,
      level: result.level,
      accuracy: result.accuracy,
      shots: result.shots,
      hits: result.hits,
      combo: result.maxCombo,
      eventId: eventId ?? null,
      seasonId: seasonId ?? null,
      createdAt: new Date().toISOString(),
    };
    const all = [...this.read(), entry].sort((a, b) => b.score - a.score).slice(0, MAX_STORED);
    this.write(all);
    return entry;
  }

  async getLeaderboard({ period, limit, eventId, seasonId }: LeaderboardQuery): Promise<ScoreEntry[]> {
    const since = periodStart(period);
    return this.read()
      .filter((e) => (since ? e.createdAt >= since : true))
      .filter((e) => (eventId ? e.eventId === eventId : true))
      .filter((e) => (seasonId ? e.seasonId === seasonId : true))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private read(): ScoreEntry[] {
    try {
      const raw = window.localStorage.getItem(`${this.gameId}:scores`);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as ScoreEntry[]) : [];
    } catch {
      return [];
    }
  }

  private write(entries: ScoreEntry[]): void {
    try {
      window.localStorage.setItem(`${this.gameId}:scores`, JSON.stringify(entries));
    } catch {
      // Almacenamiento no disponible (modo privado): el ranking queda solo en memoria
    }
  }
}
