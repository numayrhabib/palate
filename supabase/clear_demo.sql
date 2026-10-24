-- Removes all Palate demo data (restaurants, people, reviews and episodes marked is_demo).
delete from public.episodes where is_demo;
delete from public.reviews where is_demo;
delete from public.restaurants where is_demo;
delete from public.profiles where is_demo;
