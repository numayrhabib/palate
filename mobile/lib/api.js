import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

const must = ({ data, error }) => { if (error) throw error; return data; };

/* ---------- Reading ---------- */
export async function getFeed({ userId, following = false, restaurantId, authorId, limit = 40 } = {}) {
  let q = supabase.from("feed").select("*").order("created_at", { ascending: false }).limit(limit);
  if (restaurantId) q = q.eq("restaurant_id", restaurantId);
  if (authorId) q = q.eq("user_id", authorId);
  if (following && userId) {
    const ids = must(await supabase.from("follows").select("following_id").eq("follower_id", userId)).map((f) => f.following_id);
    if (!ids.length) return [];
    q = q.in("user_id", ids);
  }
  const rows = must(await q);
  if (userId && rows.length) {
    const ids = rows.map((r) => r.id);
    const [likes, helpful] = await Promise.all([
      supabase.from("likes").select("review_id").eq("user_id", userId).in("review_id", ids),
      supabase.from("review_helpful").select("review_id").eq("user_id", userId).in("review_id", ids),
    ]);
    const L = new Set((likes.data || []).map((x) => x.review_id));
    const H = new Set((helpful.data || []).map((x) => x.review_id));
    rows.forEach((r) => { r.liked = L.has(r.id); r.markedHelpful = H.has(r.id); });
  }
  return rows;
}

export async function getRestaurants({ area, search, takaPick, plated } = {}) {
  let q = supabase.from("restaurant_stats").select("*").order("score", { ascending: false, nullsFirst: false }).limit(300);
  if (area) q = q.eq("area", area);
  if (takaPick) q = q.eq("taka_pick", true);
  if (plated) q = q.gt("plates", 0);
  if (search) q = q.ilike("name", `%${search}%`);
  return must(await q);
}

export const getRestaurant = async (id) => must(await supabase.from("restaurant_stats").select("*").eq("id", id).single());

export const getDishes = async () => must(await supabase.from("dishes").select("*").order("name_en"));

export async function getDishRankings(dishId) {
  let q = supabase.from("dish_rankings").select("*").order("position");
  if (dishId) q = q.eq("dish_id", dishId);
  return must(await q);
}

export const getEpisodes = async () =>
  must(await supabase.from("episodes").select("*, restaurants(id, name, area)").order("published_at", { ascending: false }).limit(10));

export const getProfile = async (id) => must(await supabase.from("profile_stats").select("*").eq("id", id).single());

export async function getTopCritics() {
  return must(await supabase.from("profile_stats").select("*").in("role", ["critic"]).order("followers", { ascending: false }).limit(10));
}

export async function getRankings(userId) {
  const rows = must(await supabase.from("rankings")
    .select("bucket, position, score, restaurant_id, restaurants(id, name, area, cover_url)")
    .eq("user_id", userId).order("position"));
  const out = { loved: [], fine: [], bad: [] };
  rows.forEach((r) => out[r.bucket].push({ id: r.restaurant_id, name: r.restaurants?.name, area: r.restaurants?.area, cover_url: r.restaurants?.cover_url, score: Number(r.score) }));
  return out;
}

export async function getSaved(userId) {
  return must(await supabase.from("saves").select("restaurant_id, restaurants(id, name, area, cover_url)").eq("user_id", userId))
    .map((s) => s.restaurants).filter(Boolean);
}

export async function isSaved(userId, restaurantId) {
  const { data } = await supabase.from("saves").select("restaurant_id").eq("user_id", userId).eq("restaurant_id", restaurantId).maybeSingle();
  return !!data;
}

export async function isFollowing(me, them) {
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", me).eq("following_id", them).maybeSingle();
  return !!data;
}

export const getTasteTwins = async () => must(await supabase.rpc("taste_twins", { min_common: 2 }));

export async function getMyApplication(userId) {
  const { data } = await supabase.from("critic_applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

/* ---------- Writing ---------- */
export async function toggle(table, keys, on) {
  if (on) must(await supabase.from(table).upsert(keys));
  else { let q = supabase.from(table).delete(); for (const [k, v] of Object.entries(keys)) q = q.eq(k, v); must(await q); }
}

export const report = async (userId, reviewId, reason) =>
  must(await supabase.from("flags").insert({ user_id: userId, review_id: reviewId, reason }));

export const applyCritic = async (userId, motivation) =>
  must(await supabase.from("critic_applications").insert({ user_id: userId, motivation }));

export const startClubTest = async () => must(await supabase.rpc("start_club_test"));
export const endClubTest = async () => must(await supabase.rpc("end_club_test"));

export const addRestaurant = async (userId, r) =>
  must(await supabase.from("restaurants").insert({ ...r, created_by: userId }).select().single());

async function upload(bucket, userId, asset, i) {
  const path = `${userId}/${Date.now()}-${i}.jpg`;
  must(await supabase.storage.from(bucket).upload(path, decode(asset.base64), { contentType: "image/jpeg" }));
  return bucket === "review-photos" ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : path;
}

export async function saveRankings(userId, ranks) {
  const rows = [];
  for (const b of ["loved", "fine", "bad"]) ranks[b].forEach((r, i) =>
    rows.push({ user_id: userId, restaurant_id: r.id, bucket: b, position: i, score: r.score }));
  if (rows.length) must(await supabase.from("rankings").upsert(rows));
}

export async function postReview(userId, d) {
  const photo_urls = [];
  for (let i = 0; i < d.photos.length; i++) photo_urls.push(await upload("review-photos", userId, d.photos[i], i));
  const receipt_path = d.receipt ? await upload("receipts", userId, d.receipt, "r") : null;
  return must(await supabase.from("reviews").insert({
    user_id: userId, restaurant_id: d.restaurantId, dish_id: d.dishId || null, dish_name: d.dishName || null,
    body: d.body || null, bucket: d.bucket, score: d.score, cleanliness: d.cleanliness || null,
    spent: d.spent ? Number(d.spent) : null, photo_urls, receipt_path,
  }).select().single());
}

/* ---------- Scoring (Beli-style buckets) ---------- */
const BUCKET = { loved: [6.8, 10], fine: [4.0, 6.7], bad: [0.5, 3.9] };
export function scoreFor(bucket, idx, n) {
  const [lo, hi] = BUCKET[bucket];
  if (n <= 1) return +(hi - (hi - lo) * 0.25).toFixed(1);
  return +(hi - ((hi - lo) * idx) / (n - 1)).toFixed(1);
}
