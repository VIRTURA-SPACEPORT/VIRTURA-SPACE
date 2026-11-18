-- Deployed via Supabase migration waitlist_and_beta_access_grants.
-- Additive and default-deny. Existing members and OTP unchanged.
create table public.registration_waitlist (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','contacted','declined','withdrawn')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 constraint waitlist_review_consistency check ((reviewed_at is null and reviewed_by is null) or (reviewed_at is not null and reviewed_by is not null))
);
create index registration_waitlist_created_at_idx on public.registration_waitlist(created_at desc);
alter table public.registration_waitlist enable row level security;
revoke all on table public.registration_waitlist from public,anon,authenticated;
grant select on table public.registration_waitlist to authenticated;
grant insert(user_id) on table public.registration_waitlist to authenticated;
grant all on table public.registration_waitlist to service_role;
create policy "Users read only own waitlist state" on public.registration_waitlist for select to authenticated using (user_id=(select auth.uid()));
create policy "Users can request only their own pending waitlist" on public.registration_waitlist for insert to authenticated with check (user_id=(select auth.uid()) and status='pending' and reviewed_at is null and reviewed_by is null);
create table public.beta_access_grants (
 user_id uuid not null references auth.users(id) on delete cascade,
 app_id text not null check (app_id ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
 status text not null default 'active' check (status in ('active','revoked')),
 issued_at timestamptz not null default now(),
 expires_at timestamptz,
 revoked_at timestamptz,
 approved_by uuid references auth.users(id),
 primary key (user_id,app_id),
 constraint beta_grant_time_order check (expires_at is null or expires_at>issued_at),
 constraint beta_grant_revocation check (status<>'revoked' or revoked_at is not null)
);
create index beta_access_grants_app_id_idx on public.beta_access_grants(app_id);
alter table public.beta_access_grants enable row level security;
revoke all on table public.beta_access_grants from public,anon,authenticated;
grant select on table public.beta_access_grants to authenticated;
grant all on table public.beta_access_grants to service_role;
create policy "Users read only own beta grants" on public.beta_access_grants for select to authenticated using (user_id=(select auth.uid()));
