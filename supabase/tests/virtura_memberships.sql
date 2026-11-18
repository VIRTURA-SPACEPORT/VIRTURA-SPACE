begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'member-a@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'member-b@example.invalid'),
  ('33333333-3333-4333-8333-333333333333', 'revoked@example.invalid');

insert into public.virtura_memberships (user_id, role, status) values
  ('11111111-1111-4111-8111-111111111111', 'member', 'active'),
  ('22222222-2222-4222-8222-222222222222', 'admin', 'active'),
  ('33333333-3333-4333-8333-333333333333', 'member', 'revoked');

do $$
begin
  assert not has_table_privilege('anon', 'public.virtura_memberships', 'select,insert,update,delete,truncate');
  assert not has_table_privilege('authenticated', 'public.virtura_memberships', 'insert,update,delete,truncate');
end;
$$;

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';

do $$
begin
  assert (select count(*) = 1 from public.virtura_memberships), 'Member must see exactly their own row';
  assert (select role = 'member' from public.virtura_memberships), 'Another member role must remain hidden';
  begin
    update public.virtura_memberships set role = 'admin';
    raise exception 'Member updated their own role';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.virtura_memberships (user_id) values ('11111111-1111-4111-8111-111111111111');
    raise exception 'Member created their own access';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.virtura_memberships;
    raise exception 'Member deleted authorization data';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local "request.jwt.claim.sub" = '33333333-3333-4333-8333-333333333333';

do $$
begin
  assert (select count(*) = 0 from public.virtura_memberships), 'Revoked membership must be inaccessible';
end;
$$;

set local role anon;

do $$
begin
  begin
    perform * from public.virtura_memberships;
    raise exception 'Anonymous client read membership data';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
