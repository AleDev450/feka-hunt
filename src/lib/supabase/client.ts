import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

/** Devuelve el cliente de Supabase, o null si no está configurado. */
export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true } }) : null;
  return client;
}
