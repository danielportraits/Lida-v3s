-- LIDA / Supabase schema
-- Ejecuta todo este archivo en Supabase SQL Editor con un proyecto nuevo.
-- IMPORTANTE: configura Auth > URL Configuration y el proveedor de correo antes de publicar.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  bio text not null default 'La vida es mejor en comunidad.',
  avatar_url text,
  is_online boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists profiles_username_search on public.profiles using gin (username gin_trgm_ops);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(sender_id <> receiver_id)
);
create unique index if not exists friend_requests_one_pending on public.friend_requests(sender_id, receiver_id) where status='pending';

create table if not exists public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,friend_id),
  check(user_id <> friend_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check(type in ('direct','group')),
  title text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_favorite boolean not null default false,
  primary key(conversation_id,user_id)
);
create index if not exists conversation_members_user on public.conversation_members(user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  message_type text not null default 'text' check(message_type in ('text','image','file','voice','system')),
  media_url text,
  reply_to uuid references public.messages(id) on delete set null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists messages_conversation_created on public.messages(conversation_id,created_at);
create or replace function public.touch_conversation() returns trigger language plpgsql security definer set search_path=public as $$
begin update public.conversations set updated_at=new.created_at where id=new.conversation_id; return new; end $$;
drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages for each row execute function public.touch_conversation();

create or replace function public.is_conversation_member(cid uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.conversation_members where conversation_id=cid and user_id=auth.uid());
$$;

create or replace function public.accept_friend_request(request_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare r public.friend_requests;
begin
  select * into r from public.friend_requests where id=request_id for update;
  if not found or r.receiver_id <> auth.uid() or r.status <> 'pending' then
    raise exception 'Solicitud no disponible';
  end if;
  update public.friend_requests set status='accepted',updated_at=now() where id=request_id;
  insert into public.friendships(user_id,friend_id) values(r.sender_id,r.receiver_id) on conflict do nothing;
  insert into public.friendships(user_id,friend_id) values(r.receiver_id,r.sender_id) on conflict do nothing;
  -- Direct conversation is created on first open, not automatically for every request.
end $$;

create or replace function public.get_or_create_direct_conversation(other_user_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare existing_id uuid; new_id uuid;
begin
  if auth.uid() is null or other_user_id=auth.uid() then raise exception 'Usuario no válido'; end if;
  if not exists(select 1 from public.friendships where user_id=auth.uid() and friend_id=other_user_id) then
    raise exception 'Primero deben aceptar la solicitud de amistad';
  end if;
  select c.id into existing_id
  from public.conversations c
  join public.conversation_members a on a.conversation_id=c.id and a.user_id=auth.uid()
  join public.conversation_members b on b.conversation_id=c.id and b.user_id=other_user_id
  where c.type='direct'
  limit 1;
  if existing_id is not null then return existing_id; end if;
  insert into public.conversations(type,created_by) values('direct',auth.uid()) returning id into new_id;
  insert into public.conversation_members(conversation_id,user_id) values(new_id,auth.uid()),(new_id,other_user_id);
  return new_id;
end $$;

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Profiles visible to authenticated users" on public.profiles;
create policy "Profiles visible to authenticated users" on public.profiles for select to authenticated using (true);
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (id=auth.uid());
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists "Requests visible to sender or receiver" on public.friend_requests;
create policy "Requests visible to sender or receiver" on public.friend_requests for select to authenticated using (sender_id=auth.uid() or receiver_id=auth.uid());
drop policy if exists "Users send own requests" on public.friend_requests;
create policy "Users send own requests" on public.friend_requests for insert to authenticated with check (sender_id=auth.uid() and receiver_id<>auth.uid());
drop policy if exists "Receiver updates requests" on public.friend_requests;
create policy "Receiver updates requests" on public.friend_requests for update to authenticated using (receiver_id=auth.uid()) with check (receiver_id=auth.uid());

drop policy if exists "Friendships visible to owner" on public.friendships;
create policy "Friendships visible to owner" on public.friendships for select to authenticated using (user_id=auth.uid());
-- Writes to friendships happen only through the SECURITY DEFINER accept_friend_request RPC.

drop policy if exists "Members can see their conversations" on public.conversations;
create policy "Members can see their conversations" on public.conversations for select to authenticated using (public.is_conversation_member(id));
drop policy if exists "Authenticated users can create conversations" on public.conversations;
create policy "Authenticated users can create conversations" on public.conversations for insert to authenticated with check (created_by=auth.uid());
drop policy if exists "Members can see membership" on public.conversation_members;
create policy "Members can see membership" on public.conversation_members for select to authenticated using (user_id=auth.uid() or public.is_conversation_member(conversation_id));
drop policy if exists "Users can update own membership" on public.conversation_members;
create policy "Users can update own membership" on public.conversation_members for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
-- Conversation membership inserts are restricted to trusted SECURITY DEFINER RPCs in a hardened deployment.

drop policy if exists "Members read messages" on public.messages;
create policy "Members read messages" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists "Members send messages as self" on public.messages;
create policy "Members send messages as self" on public.messages for insert to authenticated with check (sender_id=auth.uid() and public.is_conversation_member(conversation_id));
drop policy if exists "Sender edits own messages" on public.messages;
create policy "Sender edits own messages" on public.messages for update to authenticated using (sender_id=auth.uid() and public.is_conversation_member(conversation_id)) with check (sender_id=auth.uid());

-- Realtime: añade messages y friend_requests a la publicación supabase_realtime si no están ya.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null;
when undefined_object then null;
end $$;

-- Storage bucket for attachments: create a PRIVATE bucket named chat-media in Storage.
-- Add policies that permit authenticated members to upload/read only their own path and
-- implement signed URLs before using private media in production. Do not make user uploads public.
