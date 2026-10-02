-- SUWAILIH PROMPT: minimal schema.
-- Prerequisite: Supabase Dashboard > Authentication > Third-party Auth > add Firebase (your project id).
-- Firebase tokens carry the user's uid in the `sub` claim, which RLS uses below.
-- The app sets the custom claim role=authenticated on each user (see /api/session).

create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique default (auth.jwt() ->> 'sub'),
  name         text,
  email        text,
  avatar       text,
  created_at   timestamptz not null default now()
);

create table if not exists public.prompts (
  id               uuid primary key default gen_random_uuid(),
  firebase_uid     text not null default (auth.jwt() ->> 'sub'),
  original_prompt  text not null check (char_length(original_prompt) between 1 and 2000),
  optimized_prompt text not null check (char_length(optimized_prompt) between 1 and 20000),
  category         text not null check (category in
    ('general','coding','website','mobile','image','video','marketing','business','research')),
  created_at       timestamptz not null default now()
);

create index if not exists prompts_uid_created_idx on public.prompts (firebase_uid, created_at desc);

alter table public.profiles enable row level security;
alter table public.prompts  enable row level security;

revoke all on public.profiles, public.prompts from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.prompts  to authenticated;

-- profiles: own row only
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (firebase_uid = (select auth.jwt() ->> 'sub'));
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (firebase_uid = (select auth.jwt() ->> 'sub'));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (firebase_uid = (select auth.jwt() ->> 'sub'))
  with check (firebase_uid = (select auth.jwt() ->> 'sub'));

-- prompts: read / create / delete own rows only (no updates)
create policy "prompts_select_own" on public.prompts for select to authenticated
  using (firebase_uid = (select auth.jwt() ->> 'sub'));
create policy "prompts_insert_own" on public.prompts for insert to authenticated
  with check (firebase_uid = (select auth.jwt() ->> 'sub'));
create policy "prompts_delete_own" on public.prompts for delete to authenticated
  using (firebase_uid = (select auth.jwt() ->> 'sub'));
