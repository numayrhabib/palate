-- Palate database, version 2
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- WARNING: this rebuilds every Palate table from scratch (test data is removed).

create extension if not exists pgcrypto;

-- Clean slate ------------------------------------------------------------
drop view if exists public.feed, public.restaurant_stats, public.dish_rankings, public.profile_stats cascade;
drop table if exists public.flags, public.review_helpful, public.likes, public.saves, public.follows,
  public.rankings, public.critic_applications, public.episodes, public.reviews, public.dishes,
  public.restaurants, public.profiles cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.taste_twins(int) cascade;
drop function if exists public.start_club_test() cascade;
drop function if exists public.end_club_test() cascade;

-- People -----------------------------------------------------------------
create table public.profiles (
  id uuid primary key,                       -- same id as the sign-in account (demo people have none)
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  role text not null default 'member' check (role in ('member','critic','admin')),
  club_until timestamptz,                    -- Palate Club membership end date
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text := split_part(coalesce(new.email, 'guest'), '@', 1);
begin
  insert into public.profiles (id, display_name, username, role)
  values (new.id, base, base || '_' || substr(new.id::text, 1, 4),
          case when lower(new.email) = 'numayrhabib@gmail.com' then 'admin' else 'member' end)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Give everyone who already signed up a profile again
insert into public.profiles (id, display_name, username, role)
select u.id, split_part(u.email, '@', 1), split_part(u.email, '@', 1) || '_' || substr(u.id::text, 1, 4),
       case when lower(u.email) = 'numayrhabib@gmail.com' then 'admin' else 'member' end
from auth.users u on conflict (id) do nothing;

-- Places and dishes --------------------------------------------------------
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  address text,
  cuisine_en text,
  cuisine_bn text,
  price_level smallint check (price_level between 1 and 4),
  avg_cost int,                               -- typical spend per person in Taka
  cover_url text,
  lat double precision,
  lng double precision,
  google_place_id text unique,
  google_rating numeric(2,1),
  plates smallint not null default 0 check (plates between 0 and 3),   -- Palate Guide, admin only
  taka_pick boolean not null default false,                            -- great food under 1,000 Taka, admin only
  is_demo boolean not null default false,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_bn text,
  photo_url text
);

-- Reviews ----------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete set null,
  dish_name text,
  body text,
  bucket text not null check (bucket in ('loved','fine','bad')),
  score numeric(3,1) not null check (score between 0 and 10),
  cleanliness smallint check (cleanliness between 1 and 5),
  spent int,                                  -- Taka per person
  photo_urls text[] not null default '{}',
  receipt_path text,                          -- private receipt photo, admins only
  verified boolean not null default false,    -- visit confirmed by an admin
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_restaurant_idx on public.reviews (restaurant_id);
create index reviews_user_idx on public.reviews (user_id);
create index reviews_created_idx on public.reviews (created_at desc);

create table public.rankings (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  bucket text not null check (bucket in ('loved','fine','bad')),
  position int not null,
  score numeric(3,1) not null,
  primary key (user_id, restaurant_id)
);

create table public.likes (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  primary key (user_id, review_id)
);
create table public.review_helpful (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  primary key (user_id, review_id)
);
create table public.saves (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  primary key (user_id, restaurant_id)
);
create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);
create table public.critic_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  motivation text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  guest_name text not null,
  guest_role text,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  favourite_dish text,
  video_url text,
  thumbnail_url text,
  published_at timestamptz not null default now(),
  is_demo boolean not null default false
);

-- Views --------------------------------------------------------------------
-- Palate score: critic reviews count three times as much as member reviews.
create view public.restaurant_stats with (security_invoker = on) as
select r.*,
  round(sum(v.score * case when p.role in ('critic','admin') then 3 else 1 end)
        / nullif(sum(case when p.role in ('critic','admin') then 3 else 1 end), 0), 1) as score,
  round(avg(v.score) filter (where p.role in ('critic','admin')), 1) as critic_score,
  count(v.id) as review_count,
  count(v.id) filter (where p.role in ('critic','admin')) as critic_count,
  count(v.id) filter (where v.verified) as verified_count,
  round(avg(v.cleanliness), 1) as cleanliness,
  round(avg(v.spent))::int as avg_spent
from public.restaurants r
left join public.reviews v on v.restaurant_id = r.id
left join public.profiles p on p.id = v.user_id
group by r.id;

create view public.feed with (security_invoker = on) as
select v.id, v.dish_name, v.dish_id, v.body, v.score, v.bucket, v.cleanliness, v.spent, v.photo_urls,
       v.verified, v.created_at, v.restaurant_id, v.user_id,
       p.display_name, p.username, p.avatar_url, p.role,
       (p.club_until is not null and p.club_until > now()) as club,
       r.name as restaurant_name, r.area, r.price_level, r.cover_url,
       (select count(*) from public.likes l where l.review_id = v.id) as like_count,
       (select count(*) from public.review_helpful h where h.review_id = v.id) as helpful_count
from public.reviews v
join public.profiles p on p.id = v.user_id
join public.restaurants r on r.id = v.restaurant_id;

-- Best places for each dish (needs at least one review mentioning the dish)
create view public.dish_rankings with (security_invoker = on) as
select d.id as dish_id, d.slug, d.name_en, d.name_bn, d.photo_url,
       r.id as restaurant_id, r.name as restaurant_name, r.area, r.cover_url,
       round(sum(v.score * case when p.role in ('critic','admin') then 3 else 1 end)
             / sum(case when p.role in ('critic','admin') then 3 else 1 end), 1) as score,
       count(v.id) as review_count,
       rank() over (partition by d.id order by
         sum(v.score * case when p.role in ('critic','admin') then 3 else 1 end)
         / sum(case when p.role in ('critic','admin') then 3 else 1 end) desc) as position
from public.dishes d
join public.reviews v on v.dish_id = d.id
join public.profiles p on p.id = v.user_id
join public.restaurants r on r.id = v.restaurant_id
group by d.id, r.id;

create view public.profile_stats with (security_invoker = on) as
select p.id, p.username, p.display_name, p.bio, p.avatar_url, p.role, p.is_demo,
       (p.club_until is not null and p.club_until > now()) as club,
       (select count(*) from public.reviews v where v.user_id = p.id) as review_count,
       (select count(*) from public.reviews v where v.user_id = p.id and cardinality(v.photo_urls) > 0) as photo_review_count,
       (select count(*) from public.reviews v where v.user_id = p.id and v.verified) as verified_count,
       (select count(*) from public.review_helpful h join public.reviews v on v.id = h.review_id where v.user_id = p.id) as helpful_received,
       (select count(*) from public.follows f where f.following_id = p.id) as followers,
       (select count(*) from public.follows f where f.follower_id = p.id) as following
from public.profiles p;

-- Taste twins: people whose rankings are closest to yours (needs 2+ places in common)
create or replace function public.taste_twins(min_common int default 2)
returns table (user_id uuid, display_name text, username text, avatar_url text, role text, common int, match int)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.username, p.avatar_url, p.role,
         count(*)::int as common,
         greatest(0, round(100 - avg(abs(mine.score - theirs.score)) * 12))::int as match
  from public.rankings mine
  join public.rankings theirs on theirs.restaurant_id = mine.restaurant_id and theirs.user_id <> mine.user_id
  join public.profiles p on p.id = theirs.user_id
  where mine.user_id = auth.uid()
  group by p.id
  having count(*) >= min_common
  order by match desc, common desc
  limit 20;
$$;

-- Palate Club (TEST MODE: free 30 days, no payment). Replace with Google Play billing before launch.
create or replace function public.start_club_test() returns timestamptz
language plpgsql security definer set search_path = public as $$
declare until_ts timestamptz := now() + interval '30 days';
begin
  perform set_config('palate.trusted_write', 'on', true);
  update public.profiles set club_until = until_ts where id = auth.uid();
  return until_ts;
end $$;
create or replace function public.end_club_test() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('palate.trusted_write', 'on', true);
  update public.profiles set club_until = null where id = auth.uid();
end $$;

-- Guards: only admins can change roles, awards and verification ---------------
create or replace function public.guard_profiles() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_setting('palate.trusted_write', true) = 'on' or public.is_admin() or auth.uid() is null then
    return new;
  end if;
  new.role := old.role; new.club_until := old.club_until; new.is_demo := old.is_demo;
  return new;
end $$;
create trigger guard_profiles before update on public.profiles for each row execute function public.guard_profiles();

create or replace function public.guard_restaurants() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.is_admin() or auth.uid() is null then return new; end if;
  new.plates := 0; new.taka_pick := false; new.is_demo := false;
  return new;
end $$;
create trigger guard_restaurants before insert on public.restaurants for each row execute function public.guard_restaurants();

create or replace function public.guard_reviews() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.is_admin() or auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then new.verified := false; new.is_demo := false;
  else new.verified := old.verified; new.is_demo := old.is_demo; end if;
  return new;
end $$;
create trigger guard_reviews before insert or update on public.reviews for each row execute function public.guard_reviews();

-- Row level security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.dishes enable row level security;
alter table public.reviews enable row level security;
alter table public.rankings enable row level security;
alter table public.likes enable row level security;
alter table public.review_helpful enable row level security;
alter table public.saves enable row level security;
alter table public.follows enable row level security;
alter table public.flags enable row level security;
alter table public.critic_applications enable row level security;
alter table public.episodes enable row level security;

create policy "read" on public.profiles for select using (true);
create policy "edit own or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "read" on public.restaurants for select using (true);
create policy "add" on public.restaurants for insert to authenticated with check (created_by = auth.uid() or public.is_admin());
create policy "admin edit" on public.restaurants for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete" on public.restaurants for delete to authenticated using (public.is_admin());

create policy "read" on public.dishes for select using (true);
create policy "admin write" on public.dishes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read" on public.reviews for select using (true);
create policy "write own" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "edit own or admin" on public.reviews for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "delete own or admin" on public.reviews for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "read" on public.rankings for select using (true);
create policy "own" on public.rankings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read" on public.likes for select using (true);
create policy "own" on public.likes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read" on public.review_helpful for select using (true);
create policy "own" on public.review_helpful for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own" on public.saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read" on public.follows for select using (true);
create policy "own" on public.follows for all to authenticated using (follower_id = auth.uid()) with check (follower_id = auth.uid());

create policy "report" on public.flags for insert to authenticated with check (user_id = auth.uid());
create policy "own or admin read" on public.flags for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin edit" on public.flags for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "apply" on public.critic_applications for insert to authenticated with check (user_id = auth.uid());
create policy "own or admin read" on public.critic_applications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin edit" on public.critic_applications for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read" on public.episodes for select using (true);
create policy "admin write" on public.episodes for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant execute on function public.taste_twins(int), public.start_club_test(), public.end_club_test() to authenticated;

-- Storage: public food photos, private receipts -----------------------------------
insert into storage.buckets (id, name, public) values ('review-photos', 'review-photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict (id) do nothing;

drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id in ('review-photos','receipts') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "read photos" on storage.objects;
create policy "read photos" on storage.objects for select using (bucket_id = 'review-photos');
drop policy if exists "read receipts" on storage.objects;
create policy "read receipts" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
