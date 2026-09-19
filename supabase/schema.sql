-- GALLINAZO HUNT — esquema Supabase (Fase 3 / preparación Fase 4)
-- Ejecutar en el SQL Editor de Supabase.

create extension if not exists "pgcrypto";

-- Usuarios (perfil público ligado a auth.users) -------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 12),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Catálogo de juegos (permite reutilizar el backend para futuros juegos) -------
create table if not exists public.games (
  id text primary key,                -- p. ej. 'gallinazo-hunt'
  name text not null,
  created_at timestamptz not null default now()
);
insert into public.games (id, name) values ('gallinazo-hunt', 'Gallinazo Hunt')
on conflict (id) do nothing;

-- Temporadas y eventos (Fase 4) ------------------------------------------------
create table if not exists public.seasons (
  id text primary key,                -- p. ej. '2026-t1'
  game_id text not null references public.games (id),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

create table if not exists public.events (
  id text primary key,                -- p. ej. 'fiestas-patrias-2026'
  game_id text not null references public.games (id),
  name text not null,
  promo_code text,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

-- Sesiones de juego (una por partida iniciada) ---------------------------------
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id text not null default 'gallinazo-hunt' references public.games (id),
  user_id uuid references public.users (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  client_info jsonb
);

-- Puntuaciones (se envía UNA vez al terminar la partida) -----------------------
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null default 'gallinazo-hunt' references public.games (id),
  session_id uuid references public.game_sessions (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  player_name text not null check (char_length(player_name) between 1 and 12),
  score integer not null check (score >= 0 and score < 10000000),
  level integer not null check (level >= 1),
  accuracy real not null check (accuracy between 0 and 1),
  shots integer not null check (shots >= 0),
  hits integer not null check (hits >= 0 and hits <= shots * 3),
  combo integer not null default 0,
  duration_ms integer,
  won boolean not null default false,
  event_id text references public.events (id),
  season_id text references public.seasons (id),
  created_at timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (game_id, score desc);
create index if not exists scores_created_idx on public.scores (game_id, created_at desc);
create index if not exists scores_event_idx on public.scores (event_id, score desc);
create index if not exists scores_season_idx on public.scores (season_id, score desc);

-- Leaderboards: mejor puntuación por jugador --------------------------------
create or replace view public.leaderboards as
select distinct on (coalesce(user_id::text, player_name), game_id, event_id, season_id)
  id, game_id, user_id, player_name, score, level, accuracy, event_id, season_id, created_at
from public.scores
order by coalesce(user_id::text, player_name), game_id, event_id, season_id, score desc;

-- Row Level Security -----------------------------------------------------------
alter table public.users enable row level security;
alter table public.game_sessions enable row level security;
alter table public.scores enable row level security;

create policy "users: lectura pública" on public.users for select using (true);
create policy "users: editar el propio" on public.users for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "sessions: crear" on public.game_sessions for insert with check (user_id is null or auth.uid() = user_id);
create policy "sessions: ver las propias" on public.game_sessions for select using (auth.uid() = user_id);

create policy "scores: lectura pública" on public.scores for select using (true);
create policy "scores: insertar" on public.scores for insert with check (user_id is null or auth.uid() = user_id);

-- NOTA: para producción conviene validar partidas en una Edge Function
-- (anti-trampas) en lugar de permitir inserts directos desde el cliente.
