create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.direct_conversation_pairs (
  conversation_id uuid primary key references public.conversations (id) on delete cascade,
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  constraint direct_pair_members_are_distinct check (user_a < user_b),
  constraint direct_pair_is_unique unique (user_a, user_b)
);

create index if not exists conversation_members_user_id_conversation_id_idx
  on public.conversation_members (user_id, conversation_id);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.direct_conversation_pairs enable row level security;

revoke all on table public.conversations from anon, authenticated;
revoke all on table public.conversation_members from anon, authenticated;
revoke all on table public.direct_conversation_pairs from anon, authenticated;

create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members as member_row
    where member_row.conversation_id = target_conversation_id
      and member_row.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create policy "Members can read their conversations"
  on public.conversations for select
  to authenticated
  using ((select public.is_conversation_member(id)));

create policy "Members can read conversation membership"
  on public.conversation_members for select
  to authenticated
  using ((select public.is_conversation_member(conversation_id)));

create policy "Members can read direct conversation pairs"
  on public.direct_conversation_pairs for select
  to authenticated
  using ((select public.is_conversation_member(conversation_id)));

create or replace function public.create_direct_conversation(target_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  first_member_id uuid;
  second_member_id uuid;
  candidate_conversation_id uuid;
  selected_conversation_id uuid;
begin
  if current_member_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if target_member_id is null or target_member_id = current_member_id then
    raise exception using errcode = '22023', message = 'Choose another member';
  end if;

  if not exists (
    select 1 from public.profiles where id = current_member_id
  ) or not exists (
    select 1 from public.profiles where id = target_member_id
  ) then
    raise exception using errcode = '22023', message = 'Member not found';
  end if;

  first_member_id := least(current_member_id, target_member_id);
  second_member_id := greatest(current_member_id, target_member_id);

  insert into public.conversations default values
  returning id into candidate_conversation_id;

  insert into public.direct_conversation_pairs (conversation_id, user_a, user_b)
  values (candidate_conversation_id, first_member_id, second_member_id)
  on conflict (user_a, user_b)
  do update set user_a = excluded.user_a
  returning conversation_id into selected_conversation_id;

  if selected_conversation_id <> candidate_conversation_id then
    delete from public.conversations where id = candidate_conversation_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (selected_conversation_id, current_member_id),
    (selected_conversation_id, target_member_id)
  on conflict (conversation_id, user_id) do nothing;

  return selected_conversation_id;
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public, anon;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

create or replace function public.list_direct_conversations()
returns table (
  conversation_id uuid,
  started_at timestamptz,
  member_id uuid,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select conversation_row.id, conversation_row.created_at, other_member.user_id, profile.display_name
  from public.conversation_members as own_membership
  join public.conversation_members as other_member
    on other_member.conversation_id = own_membership.conversation_id
   and other_member.user_id <> (select auth.uid())
  join public.conversations as conversation_row
    on conversation_row.id = own_membership.conversation_id
  join public.direct_conversation_pairs as pair_row
    on pair_row.conversation_id = conversation_row.id
  join public.profiles as profile
    on profile.id = other_member.user_id
  where own_membership.user_id = (select auth.uid())
  order by conversation_row.created_at desc
  limit 100;
$$;

revoke all on function public.list_direct_conversations() from public, anon;
grant execute on function public.list_direct_conversations() to authenticated;

create or replace function public.get_direct_conversation(target_conversation_id uuid)
returns table (
  conversation_id uuid,
  started_at timestamptz,
  member_id uuid,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select conversation_row.id, conversation_row.created_at, other_member.user_id, profile.display_name
  from public.conversation_members as own_membership
  join public.conversation_members as other_member
    on other_member.conversation_id = own_membership.conversation_id
   and other_member.user_id <> (select auth.uid())
  join public.conversations as conversation_row
    on conversation_row.id = own_membership.conversation_id
  join public.direct_conversation_pairs as pair_row
    on pair_row.conversation_id = conversation_row.id
  join public.profiles as profile
    on profile.id = other_member.user_id
  where own_membership.user_id = (select auth.uid())
    and conversation_row.id = target_conversation_id
  limit 1;
$$;

revoke all on function public.get_direct_conversation(uuid) from public, anon;
grant execute on function public.get_direct_conversation(uuid) to authenticated;
