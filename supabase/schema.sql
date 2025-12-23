-- Quotes Table
-- Stores individual quotes as JSONB data
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Untitled Quote',
  data jsonb not null default '{}'::jsonb,
  last_modified_by text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings Table
-- Stores application-wide settings (Global Config)
create table public.settings (
  id text primary key, -- e.g. 'global'
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.quotes enable row level security;
alter table public.settings enable row level security;

-- Policies (Basic - Public/Anon Access)
-- WARNING: These are permissive policies for development.
-- Secure these for production usage.

create policy "Allow generic access to quotes"
on public.quotes
for all
to anon
using (true)
with check (true);

create policy "Allow generic access to settings"
on public.settings
for all
to anon
using (true)
with check (true);
