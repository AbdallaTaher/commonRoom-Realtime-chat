alter table public.profiles
  add column if not exists bio text not null default '',
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_bio_length,
  add constraint profiles_bio_length check (char_length(bio) <= 160),
  drop constraint if exists profiles_avatar_path_format,
  add constraint profiles_avatar_path_format check (
    avatar_path is null
    or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
  );

grant select (id, display_name, bio, avatar_path) on table public.profiles to authenticated;
grant update (display_name, bio, avatar_path) on table public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Members can upload their own avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Members can replace their own avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Members can delete their own avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
