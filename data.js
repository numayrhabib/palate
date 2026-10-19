// Data layer. Uses Supabase when config.js has keys, otherwise an in-browser demo.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const LIVE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const BUCKET = { loved: [6.8, 10], fine: [4.0, 6.7], bad: [0.5, 3.9] };

export function scoreFor(bucket, idx, n) {
  const [lo, hi] = BUCKET[bucket];
  if (n <= 1) return +(hi - (hi - lo) * 0.25).toFixed(1);
  return +(hi - (hi - lo) * idx / (n - 1)).toFixed(1);
}

// Shrink a photo on the phone before upload so storage stays inside the free tier
export function compressImage(file, max = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? resolve(b) : reject(new Error("compress failed")), "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ---------------------------- Supabase ---------------------------- */
async function makeLive() {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let user = (await sb.auth.getSession()).data.session?.user ?? null;
  const must = ({ data, error }) => { if (error) throw error; return data; };

  return {
    get user() { return user; },
    onAuth(cb) { sb.auth.onAuthStateChange((_e, s) => { user = s?.user ?? null; cb(user); }); },
    async signIn(email) {
      must(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } }));
    },
    async signOut() { await sb.auth.signOut(); user = null; },
    async profile() {
      if (!user) return null;
      return must(await sb.from("profiles").select("*").eq("id", user.id).maybeSingle());
    },
    async restaurants() {
      return must(await sb.from("restaurant_stats").select("*").order("score", { ascending: false, nullsFirst: false }).limit(500));
    },
    async restaurant(id) {
      return must(await sb.from("restaurant_stats").select("*").eq("id", id).single());
    },
    async feed(sort, restaurantId) {
      let q = sb.from("feed").select("*").limit(50);
      if (restaurantId) q = q.eq("restaurant_id", restaurantId);
      q = sort === "nearby" ? q.order("like_count", { ascending: false }) : q.order("created_at", { ascending: false });
      const rows = must(await q);
      if (user && rows.length) {
        const mine = must(await sb.from("likes").select("review_id").eq("user_id", user.id).in("review_id", rows.map(r => r.id)));
        const set = new Set(mine.map(l => l.review_id));
        rows.forEach(r => r.liked = set.has(r.id));
      }
      return rows;
    },
    async rankings() {
      const out = { loved: [], fine: [], bad: [] };
      if (!user) return out;
      const rows = must(await sb.from("rankings").select("bucket,position,score,restaurant_id,restaurants(id,name,area)").eq("user_id", user.id).order("position"));
      rows.forEach(r => out[r.bucket].push({ id: r.restaurant_id, name: r.restaurants?.name, area: r.restaurants?.area, score: +r.score }));
      return out;
    },
    async saveRankings(ranks) {
      const rows = [];
      for (const b of ["loved", "fine", "bad"]) ranks[b].forEach((r, i) =>
        rows.push({ user_id: user.id, restaurant_id: r.id, bucket: b, position: i, score: r.score }));
      if (rows.length) must(await sb.from("rankings").upsert(rows));
    },
    async postReview({ restaurantId, dish, body, bucket, score, files }) {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const path = `${user.id}/${Date.now()}-${i}.jpg`;
        must(await sb.storage.from("review-photos").upload(path, files[i], { contentType: "image/jpeg" }));
        urls.push(sb.storage.from("review-photos").getPublicUrl(path).data.publicUrl);
      }
      must(await sb.from("reviews").insert({ user_id: user.id, restaurant_id: restaurantId, dish, body, bucket, score, photo_urls: urls }));
    },
    async setLike(reviewId, on) {
      if (on) must(await sb.from("likes").upsert({ user_id: user.id, review_id: reviewId }));
      else must(await sb.from("likes").delete().eq("user_id", user.id).eq("review_id", reviewId));
    },
    async saves() {
      if (!user) return new Set();
      return new Set(must(await sb.from("saves").select("restaurant_id").eq("user_id", user.id)).map(s => s.restaurant_id));
    },
    async setSave(restaurantId, on) {
      if (on) must(await sb.from("saves").upsert({ user_id: user.id, restaurant_id: restaurantId }));
      else must(await sb.from("saves").delete().eq("user_id", user.id).eq("restaurant_id", restaurantId));
    },
    async addRestaurant(r) {
      return must(await sb.from("restaurants").insert({ ...r, created_by: user.id }).select().single());
    },
    async myReviewCount() {
      if (!user) return 0;
      const { count } = await sb.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      return count || 0;
    }
  };
}

/* ------------------------------ Demo ------------------------------ */
function makeDemo() {
  const R = [
    {id:"r1",name:"Haji Lane Biryani House",area:"olddhaka",cuisine_en:"Biryani · Bangladeshi",cuisine_bn:"বিরিয়ানি · দেশি",price:1,score:9.3,google_rating:4.4,review_count:212,signature_dish:"Mutton kacchi",plates:3},
    {id:"r2",name:"The Brass Fork",area:"gulshan",cuisine_en:"Modern European",cuisine_bn:"মডার্ন ইউরোপিয়ান",price:4,score:8.8,google_rating:4.6,review_count:148,signature_dish:"Duck confit",plates:2},
    {id:"r3",name:"Mezban Ghor",area:"mohammadpur",cuisine_en:"Chittagonian",cuisine_bn:"চাটগাঁইয়া",price:2,score:9.0,google_rating:4.3,review_count:176,signature_dish:"Mezbani beef",plates:2},
    {id:"r4",name:"Lakeside Tehari",area:"banani",cuisine_en:"Tehari · Breakfast",cuisine_bn:"তেহারি · নাস্তা",price:1,score:7.6,google_rating:4.1,review_count:94,signature_dish:"Beef tehari",plates:0},
    {id:"r5",name:"Saltwater Hilsa",area:"uttara",cuisine_en:"Seafood · Bengali",cuisine_bn:"সামুদ্রিক · বাঙালি",price:3,score:8.4,google_rating:4.5,review_count:121,signature_dish:"Shorshe ilish",plates:1},
    {id:"r6",name:"Chaa Nagar",area:"dhanmondi",cuisine_en:"Tea · Snacks",cuisine_bn:"চা · নাস্তা",price:1,score:6.9,google_rating:4.2,review_count:88,signature_dish:"Malai cha",plates:0},
    {id:"r7",name:"Smoke & Naan",area:"bashundhara",cuisine_en:"Grill · Mughlai",cuisine_bn:"গ্রিল · মোগলাই",price:2,score:8.1,google_rating:4.0,review_count:103,signature_dish:"Chicken tikka",plates:1},
    {id:"r8",name:"Dhanmondi Dumplings",area:"dhanmondi",cuisine_en:"Chinese · Momo",cuisine_bn:"চাইনিজ · মোমো",price:2,score:7.9,google_rating:4.3,review_count:77,signature_dish:"Pan-fried momo",plates:0},
    {id:"r9",name:"Nawab's Table",area:"olddhaka",cuisine_en:"Mughlai · Kebab",cuisine_bn:"মোগলাই · কাবাব",price:2,score:8.6,google_rating:4.2,review_count:139,signature_dish:"Shami kebab",plates:1}
  ];
  const U = {
    nusrat:{display_name:"Nusrat Jahan",username:"nusratfoodbank",trusted:true},
    tanvir:{display_name:"Tanvir Ahmed",username:"tanvir.eats",trusted:true},
    mehjabin:{display_name:"Mehjabin K.",username:"mehjabin.dines",trusted:true},
    rafi:{display_name:"Rafi Hasan",username:"rafi.h",trusted:false}
  };
  const ago = m => new Date(Date.now() - m * 60000).toISOString();
  const base = [
    {id:"p1",u:"nusrat",rid:"r1",dish:"Mutton kacchi",score:9.6,m:42,likes:318,body:"Meat falls off the bone, aloo soaked through with ghee. Go before 1pm or it sells out. ৳380 for a full plate is a steal."},
    {id:"p2",u:"tanvir",rid:"r3",dish:"Mezbani beef",score:9.1,m:180,likes:204,body:"Closest thing to a real Chittagong mezban in Dhaka. Properly spicy, deep black-pepper heat. Ask for extra dal."},
    {id:"p3",u:"mehjabin",rid:"r2",dish:"Duck confit",score:8.7,m:420,likes:131,body:"Crisp skin, good lentils underneath. Pricey, but the service is the best in Gulshan right now. Book on weekends."},
    {id:"p4",u:"rafi",rid:"r6",dish:"Malai cha",score:6.4,m:1500,likes:46,body:"Cha is great, the singara was cold. Worth it for the tea and the lake breeze, not the snacks."},
    {id:"p5",u:"tanvir",rid:"r5",dish:"Shorshe ilish",score:8.5,m:2900,likes:97,body:"Mustard is sharp the way it should be, fish was fresh. Small portion for the price though."}
  ].map(p => { const r = R.find(x => x.id === p.rid);
    return { id:p.id, user_id:p.u, ...U[p.u], restaurant_id:r.id, restaurant_name:r.name, area:r.area, price:r.price,
      dish:p.dish, body:p.body, score:p.score, photo_urls:[], created_at:ago(p.m), like_count:p.likes }; });

  let st = { liked:{}, saved:{}, mine:[], ranks:{
    loved:[{id:"r3",name:"Mezban Ghor",area:"mohammadpur",score:9.4},{id:"r1",name:"Haji Lane Biryani House",area:"olddhaka",score:8.7}],
    fine:[{id:"r6",name:"Chaa Nagar",area:"dhanmondi",score:5.4}], bad:[] } };
  try { const s = JSON.parse(localStorage.getItem("palate-demo") || "null"); if (s) st = { ...st, ...s }; } catch (e) {}
  const persist = () => { try { localStorage.setItem("palate-demo", JSON.stringify(st)); } catch (e) {} };
  const demoUser = { id:"me", email:"you@demo" };
  const withLikes = rows => rows.map(r => ({ ...r, liked: !!st.liked[r.id], like_count: r.like_count + (st.liked[r.id] ? 1 : 0) }));

  return {
    user: demoUser,
    onAuth() {},
    async signIn() {}, async signOut() {},
    async profile() { return { id:"me", display_name:"Numayr", username:"numayr", trusted:false }; },
    async restaurants() { return R.slice().sort((a, b) => b.score - a.score); },
    async restaurant(id) { return R.find(r => r.id === id); },
    async feed(sort, restaurantId) {
      let rows = [...st.mine, ...base];
      if (restaurantId) rows = rows.filter(r => r.restaurant_id === restaurantId);
      rows.sort(sort === "nearby" ? (a, b) => b.like_count - a.like_count : (a, b) => b.created_at.localeCompare(a.created_at));
      return withLikes(rows);
    },
    async rankings() { return JSON.parse(JSON.stringify(st.ranks)); },
    async saveRankings(ranks) { st.ranks = ranks; persist(); },
    async postReview({ restaurantId, dish, body, bucket, score, previews }) {
      const r = R.find(x => x.id === restaurantId);
      st.mine.unshift({ id:"m" + Date.now(), user_id:"me", display_name:"Numayr", username:"numayr", trusted:false,
        restaurant_id:r.id, restaurant_name:r.name, area:r.area, price:r.price, dish, body, bucket, score,
        photo_urls: previews.slice(0, 1), created_at: new Date().toISOString(), like_count:0 });
      st.mine = st.mine.slice(0, 10); persist();
    },
    async setLike(id, on) { st.liked[id] = on; persist(); },
    async saves() { return new Set(Object.keys(st.saved).filter(k => st.saved[k])); },
    async setSave(id, on) { st.saved[id] = on; persist(); },
    async addRestaurant(r) { const n = { ...r, id:"n" + Date.now(), score:null, review_count:0, plates:0 }; R.push(n); return n; },
    async myReviewCount() { return st.mine.length; }
  };
}

export const api = LIVE ? await makeLive() : makeDemo();
