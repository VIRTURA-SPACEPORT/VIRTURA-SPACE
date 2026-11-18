create table if not exists public.virtura_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now()
);

alter table public.virtura_memberships enable row level security;

revoke all on table public.virtura_memberships from public, anon, authenticated;
grant select on table public.virtura_memberships to authenticated;
grant select, insert, update, delete on table public.virtura_memberships to service_role;

drop policy if exists "Members read their own active membership" on public.virtura_memberships;
create policy "Members read their own active membership"
  on public.virtura_memberships
  for select
  to authenticated
  using (user_id = (select auth.uid()) and status = 'active');
