-- ════════════════════════════════════════════════════════════════
-- Migration 001: Extensions, RLS policies, FTS, PostGIS, triggers
-- Run via: supabase db push  OR  Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ── RLS: profiles ────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "profiles_select_all"
  on profiles for select using (true);

create policy "profiles_insert_own"
  on profiles for insert with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on profiles for update using (auth.uid() = user_id);

create policy "profiles_delete_own"
  on profiles for delete using (auth.uid() = user_id);

-- ── RLS: user_presence ───────────────────────────────────────────
alter table user_presence enable row level security;

create policy "presence_select_all"
  on user_presence for select using (true);

create policy "presence_upsert_own"
  on user_presence for insert with check (auth.uid() = user_id);

create policy "presence_update_own"
  on user_presence for update using (auth.uid() = user_id);

-- ── RLS: conversations ───────────────────────────────────────────
alter table conversations enable row level security;

create policy "conversations_select_participant"
  on conversations for select
  using (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "conversations_insert_participant"
  on conversations for insert
  with check (auth.uid() = participant_one or auth.uid() = participant_two);

-- ── RLS: messages ────────────────────────────────────────────────
alter table messages enable row level security;

create policy "messages_select_participant"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

create policy "messages_insert_participant"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

create policy "messages_update_own"
  on messages for update using (sender_id = auth.uid());

-- ── RLS: favorites ───────────────────────────────────────────────
alter table favorites enable row level security;

create policy "favorites_select_own"
  on favorites for select using (user_id = auth.uid());

create policy "favorites_insert_own"
  on favorites for insert with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on favorites for delete using (user_id = auth.uid());

-- ── RLS: bookings ────────────────────────────────────────────────
alter table bookings enable row level security;

create policy "bookings_select_party"
  on bookings for select
  using (seeker_id = auth.uid() or provider_id = auth.uid());

create policy "bookings_insert_seeker"
  on bookings for insert with check (seeker_id = auth.uid());

create policy "bookings_update_party"
  on bookings for update
  using (seeker_id = auth.uid() or provider_id = auth.uid());

-- ── RLS: events ──────────────────────────────────────────────────
alter table events enable row level security;

create policy "events_select_public"
  on events for select using (is_public = true or host_id = auth.uid());

create policy "events_insert_own"
  on events for insert with check (host_id = auth.uid());

create policy "events_update_own"
  on events for update using (host_id = auth.uid());

create policy "events_delete_own"
  on events for delete using (host_id = auth.uid());

-- ── RLS: event_rsvps ─────────────────────────────────────────────
alter table event_rsvps enable row level security;

create policy "rsvps_select_all"
  on event_rsvps for select using (true);

create policy "rsvps_insert_own"
  on event_rsvps for insert with check (user_id = auth.uid());

create policy "rsvps_update_own"
  on event_rsvps for update using (user_id = auth.uid());

create policy "rsvps_delete_own"
  on event_rsvps for delete using (user_id = auth.uid());

-- ── RLS: meet_now_cards ──────────────────────────────────────────
alter table meet_now_cards enable row level security;

create policy "meet_now_select_all"
  on meet_now_cards for select using (true);

create policy "meet_now_insert_own"
  on meet_now_cards for insert with check (user_id = auth.uid());

create policy "meet_now_update_own"
  on meet_now_cards for update using (user_id = auth.uid());

create policy "meet_now_delete_own"
  on meet_now_cards for delete using (user_id = auth.uid());

-- ── RLS: notifications ───────────────────────────────────────────
alter table notifications enable row level security;

create policy "notifications_own"
  on notifications for select using (user_id = auth.uid());

create policy "notifications_update_own"
  on notifications for update using (user_id = auth.uid());

-- ── RLS: subscriptions ───────────────────────────────────────────
alter table subscriptions enable row level security;

create policy "subscriptions_own"
  on subscriptions for select using (user_id = auth.uid());

-- ── FTS: profiles ────────────────────────────────────────────────
alter table profiles
  add column if not exists fts tsvector generated always as (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C')
  ) stored;

create index if not exists profiles_fts_idx on profiles using gin(fts);

-- ── FTS search RPC ───────────────────────────────────────────────
create or replace function search_profiles(
  search_text text,
  p_limit     int  default 20,
  p_offset    int  default 0
)
returns table(
  user_id      uuid,
  display_name text,
  bio          text,
  avatar_url   text,
  rank         real
) as $$
begin
  return query
  select
    p.user_id,
    p.display_name,
    p.bio,
    p.avatar_url,
    ts_rank(p.fts, websearch_to_tsquery('english', search_text)) as rank
  from profiles p
  where p.fts @@ websearch_to_tsquery('english', search_text)
  order by rank desc
  limit  p_limit
  offset p_offset;
end;
$$ language plpgsql security definer;

-- ── FTS: events ──────────────────────────────────────────────────
alter table events
  add column if not exists fts tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C')
  ) stored;

create index if not exists events_fts_idx on events using gin(fts);

-- ── PostGIS: meet_now radius search ─────────────────────────────
create or replace function nearby_meet_now(
  lat       float,
  lng       float,
  radius_km float default 10
)
returns table(
  id          uuid,
  user_name   text,
  user_avatar text,
  activity    text,
  location    text,
  expires_at  timestamptz,
  distance_m  float
) as $$
begin
  return query
  select
    m.id,
    m.user_name,
    m.user_avatar,
    m.activity,
    m.location,
    m.expires_at,
    ST_Distance(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(
        (m.location_point::json->>'lng')::float,
        (m.location_point::json->>'lat')::float
      )::geography
    ) as distance_m
  from meet_now_cards m
  where
    m.is_active = true
    and m.expires_at > now()
    and m.location_point is not null
    and ST_DWithin(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(
        (m.location_point::json->>'lng')::float,
        (m.location_point::json->>'lat')::float
      )::geography,
      radius_km * 1000
    )
  order by distance_m asc;
end;
$$ language plpgsql security definer;

-- ── Auto-create profile on user signup ───────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id) values (new.id)
  on conflict do nothing;

  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Realtime: enable broadcast for messages ──────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table meet_now_cards;
alter publication supabase_realtime add table event_rsvps;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table user_presence;
