create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  default_plan text not null default 'free' check (default_plan in ('free', 'monthly', 'lifetime')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null check (plan in ('free', 'monthly', 'lifetime')),
  status text not null check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cloud_sync boolean not null default true,
  managed_ai boolean not null default false,
  link_sharing boolean not null default false,
  local_workspace_restore boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  folder_path text,
  latest_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content_markdown text not null,
  content_html text,
  version_number integer not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table if not exists public.shared_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique generated always as (id::text) stored,
  title text not null,
  rendered_html text not null,
  visibility text not null default 'link' check (visibility in ('link', 'private')),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.workspace_snapshots (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  workspace_state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.documents
  drop constraint if exists documents_latest_version_fk;

alter table public.documents
  add constraint documents_latest_version_fk
  foreign key (latest_version_id) references public.document_versions(id) on delete set null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  insert into public.entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.shared_links enable row level security;
alter table public.workspace_snapshots enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "entitlements_select_own" on public.entitlements
  for select using (auth.uid() = user_id);

create policy "documents_crud_own" on public.documents
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "document_versions_crud_owner" on public.document_versions
  for all using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  );

create policy "shared_links_crud_owner" on public.shared_links
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "shared_links_public_read" on public.shared_links
  for select using (visibility = 'link');

create policy "workspace_snapshots_crud_own" on public.workspace_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
