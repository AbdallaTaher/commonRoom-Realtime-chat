-- Members can discover each other by display name. Keep profile rows limited
-- to the ID and display name so timestamps and account emails stay private.
drop policy if exists "Members can read their own profile" on public.profiles;

create policy "Authenticated members can read the member directory"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) is not null);

revoke select on table public.profiles from authenticated;
grant select (id, display_name) on table public.profiles to authenticated;
