-- broWord initial schema
-- Apply via Supabase SQL Editor or `supabase db push`.

create extension if not exists "uuid-ossp";

-- Profile table mirrors auth.users 1:1 and tracks token usage.
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  tokens_used integer not null default 0,
  daily_token_limit integer not null default 50000,
  last_reset timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One row per processing call; useful for history and accounting.
create table if not exists public.paragraph_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  paragraph text not null,
  selected_words text[] not null,
  result jsonb,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists paragraph_sessions_user_id_idx
  on public.paragraph_sessions(user_id);
create index if not exists paragraph_sessions_created_at_idx
  on public.paragraph_sessions(created_at desc);

-- Row-level security: users only see their own data.
alter table public.profiles enable row level security;
alter table public.paragraph_sessions enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users can read own sessions" on public.paragraph_sessions;
create policy "users can read own sessions"
  on public.paragraph_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own sessions" on public.paragraph_sessions;
create policy "users can insert own sessions"
  on public.paragraph_sessions for insert
  with check (auth.uid() = user_id);

-- Auto-create a profile row whenever a new auth.users row appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reset a user's daily counter if 24h have elapsed since last_reset.
create or replace function public.reset_daily_tokens_if_needed(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set tokens_used = 0,
      last_reset = now()
  where id = p_user_id
    and last_reset < (now() - interval '1 day');
end;
$$;

-- Atomically add to tokens_used and return the new total.
create or replace function public.increment_tokens(p_user_id uuid, p_tokens integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_total integer;
begin
  update public.profiles
  set tokens_used = tokens_used + p_tokens
  where id = p_user_id
  returning tokens_used into v_new_total;
  return v_new_total;
end;
$$;
