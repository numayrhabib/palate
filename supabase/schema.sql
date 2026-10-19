-- Palate database schema
-- Run this once in Supabase: SQL Editor -> New query -> paste everything -> Run.

create extension if not exists pgcrypto;

-- People ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  trusted boolean not null default false,   -- credibility badge, set by admins only
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, username)
  values (new.id,
          split_part(coalesce(new.email, 'guest'), '@', 1),
          split_part(coalesce(new.email, 'guest'), '@', 1) || '_' || substr(new.id::text, 1, 4))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Restaurants ----------------------------------------------------------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,                 -- uttara, bashundhara, gulshan, banani, mohammadpur, dhanmondi, olddhaka, other
  cuisine_en text,
  cuisine_bn text,
  price smallint check (price between 1 and 4),
  signature_dish text,
  lat double precision,
  lng double precision,
  google_place_id text unique,        -- filled when imported from Google Places
  google_rating numeric(2,1),
  plates smallint not null default 0 check (plates between 0 and 3),  -- Palate Guide award, admins only
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Reviews --------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  dish text,
  body text,
  bucket text not null check (bucket in ('loved','fine','bad')),
  score numeric(3,1) not null check (score between 0 and 10),
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists reviews_restaurant_idx on public.reviews (restaurant_id);
create index if not exists reviews_created_idx on public.reviews (created_at desc);

-- Each person's personal ranked list (Beli-style)
create table if not exists public.rankings (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  bucket text not null check (bucket in ('loved','fine','bad')),
  position int not null,
  score numeric(3,1) not null,
  primary key (user_id, restaurant_id)
);

create table if not exists public.likes (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  primary key (user_id, review_id)
);

create table if not exists public.saves (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  primary key (user_id, restaurant_id)
);

create table if not exists public.follows (
  follower_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Views ----------------------------------------------------------------
create or replace view public.restaurant_stats with (security_invoker = on) as
select r.*,
       round(avg(v.score)::numeric, 1) as score,
       count(v.id) as review_count,
       count(v.id) filter (where p.trusted) as trusted_count
from public.restaurants r
left join public.reviews v on v.restaurant_id = r.id
left join public.profiles p on p.id = v.user_id
group by r.id;

create or replace view public.feed with (security_invoker = on) as
select v.id, v.dish, v.body, v.score, v.bucket, v.photo_urls, v.created_at,
       v.restaurant_id, v.user_id,
       p.display_name, p.username, p.trusted,
       r.name as restaurant_name, r.area, r.price,
       (select count(*) from public.likes l where l.review_id = v.id) as like_count
from public.reviews v
join public.profiles p on p.id = v.user_id
join public.restaurants r on r.id = v.restaurant_id;

-- Security: everyone can read, people can only change their own things -----
alter table public.profiles    enable row level security;
alter table public.restaurants enable row level security;
alter table public.reviews     enable row level security;
alter table public.rankings    enable row level security;
alter table public.likes       enable row level security;
alter table public.saves       enable row level security;
alter table public.follows     enable row level security;

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select using (true);
drop policy if exists "edit own profile" on public.profiles;
create policy "edit own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- people can change their name and photo, never their own credibility badge
revoke update on public.profiles from authenticated, anon;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;

drop policy if exists "read restaurants" on public.restaurants;
create policy "read restaurants" on public.restaurants for select using (true);
drop policy if exists "add restaurants" on public.restaurants;
create policy "add restaurants" on public.restaurants for insert to authenticated with check (created_by = auth.uid());
-- people can add a place but can't award plates or edit others' places
revoke insert, update, delete on public.restaurants from authenticated, anon;
grant insert (name, area, cuisine_en, cuisine_bn, price, signature_dish, lat, lng, created_by) on public.restaurants to authenticated;

drop policy if exists "read reviews" on public.reviews;
create policy "read reviews" on public.reviews for select using (true);
drop policy if exists "write own reviews" on public.reviews;
create policy "write own reviews" on public.reviews for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "edit own reviews" on public.reviews;
create policy "edit own reviews" on public.reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "delete own reviews" on public.reviews;
create policy "delete own reviews" on public.reviews for delete to authenticated using (user_id = auth.uid());

drop policy if exists "read rankings" on public.rankings;
create policy "read rankings" on public.rankings for select using (true);
drop policy if exists "own rankings" on public.rankings;
create policy "own rankings" on public.rankings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "read likes" on public.likes;
create policy "read likes" on public.likes for select using (true);
drop policy if exists "own likes" on public.likes;
create policy "own likes" on public.likes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own saves" on public.saves;
create policy "own saves" on public.saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "read follows" on public.follows;
create policy "read follows" on public.follows for select using (true);
drop policy if exists "own follows" on public.follows;
create policy "own follows" on public.follows for all to authenticated using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- Photo storage ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "read photos" on storage.objects;
create policy "read photos" on storage.objects for select using (bucket_id = 'review-photos');
