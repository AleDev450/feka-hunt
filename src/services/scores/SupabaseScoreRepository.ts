import type { SupabaseClient } from '@supabase/supabase-js';
import type { LeaderboardQuery, ScoreEntry, ScoreSubmission } from '@/types/game';
import { periodStart, sanitizePlayerName, type ScoreRepository } from './ScoreRepository';

interface ScoreRow {
  id: string;
  user_id: string | null;
  player_name: string;
  score: number;
  level: number;
  accuracy: number;
  shots: number;
  hits: number;
  combo: number;
  event_id: string | null;
  season_id: string | null;
  created_at: string;
}

const toEntry = (row: ScoreRow): ScoreEntry => ({
  id: row.id,
  playerName: row.player_name,
  userId: row.user_id,
  score: row.score,
  level: row.level,
  accuracy: row.accuracy,
  shots: row.shots,
  hits: row.hits,
  combo: row.combo,
  eventId: row.event_id,
  seasonId: row.season_id,
  createdAt: row.created_at,
});

/** Ranking online (tabla `scores`, ver supabase/schema.sql). */
export class SupabaseScoreRepository implements ScoreRepository {
  readonly source = 'online' as const;

  constructor(private readonly supabase: SupabaseClient) {}

  async submit({ playerName, result, eventId, seasonId }: ScoreSubmission): Promise<ScoreEntry> {
    const { data: auth } = await this.supabase.auth.getUser();
    const { data, error } = await this.supabase
      .from('scores')
      .insert({
        user_id: auth.user?.id ?? null,
        player_name: sanitizePlayerName(playerName),
        score: result.score,
        level: result.level,
        accuracy: result.accuracy,
        shots: result.shots,
        hits: result.hits,
        combo: result.maxCombo,
        duration_ms: result.durationMs,
        won: result.won,
        event_id: eventId ?? null,
        season_id: seasonId ?? null,
      })
      .select()
      .single<ScoreRow>();
    if (error) throw error;
    return toEntry(data);
  }

  async getLeaderboard({ period, limit, eventId, seasonId }: LeaderboardQuery): Promise<ScoreEntry[]> {
    let query = this.supabase.from('scores').select('*').order('score', { ascending: false }).limit(limit);
    const since = periodStart(period);
    if (since) query = query.gte('created_at', since);
    if (eventId) query = query.eq('event_id', eventId);
    if (seasonId) query = query.eq('season_id', seasonId);
    const { data, error } = await query.returns<ScoreRow[]>();
    if (error) throw error;
    return data.map(toEntry);
  }
}
