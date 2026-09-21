import { getSupabaseClient } from '@/lib/supabase/client';
import { LocalScoreRepository } from './LocalScoreRepository';
import type { ScoreRepository } from './ScoreRepository';
import { SupabaseScoreRepository } from './SupabaseScoreRepository';

export type { ScoreRepository } from './ScoreRepository';

/** Supabase si hay variables de entorno; si no, ranking local en el navegador. */
export function createScoreRepository(gameId = 'gallinazo-hunt'): ScoreRepository {
  const supabase = getSupabaseClient();
  return supabase ? new SupabaseScoreRepository(supabase, gameId) : new LocalScoreRepository(gameId);
}
