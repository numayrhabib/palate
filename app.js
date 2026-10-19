import { T, AREAS } from "./i18n.js";
import { api, LIVE, scoreFor, compressImage } from "./data.js";

const $ = s => document.querySelector(s);
const state = { lang: "en", tab: "feed", rid: null, view: null, area: null, sort: "forYou", draft: null, saved: new Set(), sentLink: false };
try { state.lang = localStorage.getItem("palate-lang") || "en"; } catch (e) {}

const t = k => T[state.lang][k] ?? T.en[k] ?? k;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const num = s => state.lang === "bn" ? String(s).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]) : String(s);
const areaName = a => AREAS[a]?.[state.lang] ?? (a ? a[0].toUpperCase() + a.slice(1) : "");
const cuisine = r => (state.lang === "bn" && r.cuisine_bn) || r.cuisine_en || "";
const price = p => p ? "৳".repeat(p) : "";
const sClass = s => s == null ? "s-none" : s >= 7.5 ? "s-good" : s >= 5 ? "s-mid" : "s-bad";
const fmtScore = s => s == null ? "–" : num((+s).toFixed(1));
const ago = iso => { const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  return m < 60 ? num(m) + t("minAgo") : m < 1440 ? num(Math.round(m / 60)) + t("hAgo") : num(Math.round(m / 1440)) + t("dAgo"); };
const plates = n => `<span class="plates" aria-label="${n} plates">${[1,2,3].map(i => `<i class="${i <= n ? "f" : ""}"></i>`).join("")}</span>`;

// Warm food-toned placeholder gradient picked from the id, used until a photo exists
const GRADS = [["#7A4A1E","#C9893A"],["#5B2A1C","#B3572F"],["#6B5A1F","#C7A64A"],["#1E3E4F","#5C8EA1"],["#4E3A24","#A9784A"],["#3B2B26","#9A5B3F"],["#5E2B2B","#C46A5A"],["#283A33","#7E8F6B"],["#4A2F1A","#B8823F"]];
const grad = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; const g = GRADS[h % GRADS.length]; return `background-image:linear-gradient(135deg,${g[0]},${g[1]})`; };

const ICON = {
  feed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="14" width="16" height="6" rx="2"/></svg>',
  explore:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  add:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>',
  guide:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/></svg>',
  me:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="9" r="4"/><path d="M4.5 20c1.5-3.5 4.3-5 7.5-5s6 1.5 7.5 5"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  heartF:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4h12v16l-6-4-6 4z"/></svg>'
};

function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => el.hidden = true, 2400); }
const loading = () => `<div class="center">${t("loading")}</div>`;
const failed = () => `<div class="center"><p class="error">${t("errorLoad")}</p><button class="btn ghost" data-retry>${t("retry")}</button></div>`;

/* ------------------------------ Screens ------------------------------ */
function postCard(p) {
  const mine = api.user && p.user_id === api.user.id;
  const name = mine ? t("you") : p.display_name;
  const photo = p.photo_urls?.length
    ? `<div class="photo real" style="background-image:url('${esc(p.photo_urls[0])}')" role="img" aria-label="${esc(p.dish)}"></div>`
    : `<div class="photo" style="${grad(p.restaurant_id)}"><span>${esc(p.dish)}</span></div>`;
  const saved = state.saved.has(p.restaurant_id);
  return `<article class="post">
    <div class="post-head"><div class="avatar">${esc((name || "?")[0])}</div>
      <div class="who"><b>${esc(name)}</b><span>@${esc(p.username)} · ${ago(p.created_at)}</span></div>
      ${p.trusted ? `<span class="cred">${t("credTrusted")}</span>` : ""}</div>
    ${photo}
    <div class="post-body">
      <div class="rline"><div><button class="rname" data-rid="${esc(p.restaurant_id)}">${esc(p.restaurant_name)}</button>
        <div class="meta">${esc(p.dish)} · ${areaName(p.area)} · ${price(p.price)}</div></div>
        <div class="score ${sClass(p.score)}">${fmtScore(p.score)}</div></div>
      ${p.body ? `<p>${esc(p.body)}</p>` : ""}
    </div>
    <div class="post-actions">
      <button class="act" data-like="${esc(p.id)}" aria-pressed="${!!p.liked}">${p.liked ? ICON.heartF : ICON.heart}${num(p.like_count || 0)} ${t("likes")}</button>
      <button class="act ${saved ? "saved" : ""}" data-save="${esc(p.restaurant_id)}">${ICON.bookmark}${saved ? t("saved") : t("save")}</button>
    </div></article>`;
}

async function screenFeed() {
  const posts = await api.feed(state.sort);
  state.posts = posts;
  return `<div class="screen">
    <div class="segment" role="group">${["forYou","nearby","fresh"].map(k => `<button class="chip" data-sort="${k}" aria-pressed="${state.sort === k}">${t(k)}</button>`).join("")}</div>
    ${posts.length ? posts.map(postCard).join("") : `<div class="center"><p>${t("emptyFeed")}</p><button class="btn" data-tab="add">${t("addTitle")}</button></div>`}</div>`;
}

const restRow = r => `<button class="row" data-rid="${esc(r.id)}">
  <div class="thumb" style="${grad(r.id)}"></div>
  <div class="info"><b>${esc(r.name)}</b><div class="meta">${esc(cuisine(r))} · ${areaName(r.area)} · ${price(r.price)}</div></div>
  <div class="score ${sClass(r.score)}">${fmtScore(r.score)}</div></button>`;

async function screenExplore() {
  const all = await api.restaurants();
  const counts = {}; all.forEach(r => counts[r.area] = (counts[r.area] || 0) + 1);
  const list = all.filter(r => !state.area || r.area === state.area);
  return `<div class="screen">
    <div><div class="eyebrow">${t("explore")}</div><h2>${t("exploreTitle")}</h2></div>
    <div class="map"><svg viewBox="0 0 300 360" role="img" aria-label="Map of Dhaka areas">
      <path d="M0 345 C60 330 110 352 170 345 S260 330 300 340 L300 360 L0 360Z" style="fill:var(--red-soft)"/>
      <text x="226" y="354" class="count">Buriganga</text>
      <path d="M150 42 L150 150 L210 170 L232 118 M150 150 L125 262 L70 228 M125 262 L185 318 M210 170 L185 318" fill="none" style="stroke:var(--line)" stroke-width="1.5" stroke-dasharray="3 4"/>
      ${Object.entries(AREAS).map(([k, a]) => `<g class="area ${state.area === k ? "on" : ""}" data-area="${k}" tabindex="0" role="button" aria-label="${a.en}">
        <circle cx="${a.x}" cy="${a.y}" r="${Math.min(34, 16 + (counts[k] || 0) * 4)}"/>
        <text x="${a.x}" y="${a.y - 1}" text-anchor="middle" font-weight="600">${a[state.lang]}</text>
        <text x="${a.x}" y="${a.y + 12}" text-anchor="middle" class="count">${num(counts[k] || 0)}</text></g>`).join("")}
    </svg></div>
    <div class="segment"><button class="chip" data-area="" aria-pressed="${!state.area}">${t("allAreas")}</button>
      ${Object.keys(AREAS).map(k => `<button class="chip" data-area="${k}" aria-pressed="${state.area === k}">${areaName(k)}</button>`).join("")}</div>
    <div class="list">${list.length ? list.map(restRow).join("") : `<p class="muted">${t("noneYet")}</p>`}</div>
    <div><p class="muted" style="margin:0 0 8px">${t("addPlaceSub")}</p><button class="btn ghost" data-view="newplace">${t("addPlace")}</button></div>
  </div>`;
}

async function screenRestaurant() {
  const [r, posts] = await Promise.all([api.restaurant(state.rid), api.feed("fresh", state.rid)]);
  const saved = state.saved.has(r.id);
  return `<div class="screen">
    <button class="back" data-back>‹ ${t("back")}</button>
    <div class="hero" style="${posts.find(p => p.photo_urls?.length) ? `background-image:url('${esc(posts.find(p => p.photo_urls?.length).photo_urls[0])}')` : grad(r.id)}"></div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <div class="eyebrow">${esc(cuisine(r))} · ${areaName(r.area)}</div>
      <h2>${esc(r.name)}</h2>
      ${r.plates ? `<div class="meta">${plates(r.plates)} ${t("guideKicker")} ${t("guideTitle")}</div>` : ""}
    </div>
    <div class="facts">
      <div><strong style="color:var(--red)">${fmtScore(r.score)}</strong><small>${t("palateScore")}<br>${r.review_count ? t("fromReviews").replace("{n}", num(r.review_count)) : t("noScore")}</small></div>
      <div><strong>${r.google_rating ? num((+r.google_rating).toFixed(1)) : "–"}</strong><small>${t("google")}<br>${t("googleNote")}</small></div>
      <div><strong>${price(r.price) || "–"}</strong><small>${t("price")}${r.signature_dish ? `<br>${t("mustOrder")}: ${esc(r.signature_dish)}` : ""}</small></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" data-review="${esc(r.id)}">${t("addTitle")}</button>
      <button class="btn ghost" data-save="${esc(r.id)}">${saved ? t("saved") : t("save")}</button></div>
    <div><h3>${t("whatPeopleSay")}</h3>
      ${posts.length ? posts.map(p => `<div class="review">
        <div class="rline"><b>${esc(api.user && p.user_id === api.user.id ? t("you") : p.display_name)} ${p.trusted ? `<span class="cred">${t("credTrusted")}</span>` : ""}</b><div class="score ${sClass(p.score)}">${fmtScore(p.score)}</div></div>
        <div class="meta">${esc(p.dish)} · ${ago(p.created_at)}</div>
        ${p.body ? `<p>${esc(p.body)}</p>` : ""}
        ${p.photo_urls?.length ? `<div class="review-photos">${p.photo_urls.map(u => `<img src="${esc(u)}" alt="" loading="lazy">`).join("")}</div>` : ""}
      </div>`).join("") : `<p class="muted">${t("noneYet")}</p>`}
    </div>
  </div>`;
}

function needSignIn() {
  return `<div class="screen"><div class="center"><p>${t("needSignIn")}</p><button class="btn" data-tab="me">${t("goSignIn")}</button></div></div>`;
}

async function screenAdd() {
  if (!api.user) return needSignIn();
  const d = state.draft || (state.draft = { step: 1, rid: "", dish: "", body: "", files: [], previews: [] });
  if (d.step === 1) {
    const rs = state.restList || (state.restList = await api.restaurants());
    const sorted = rs.slice().sort((a, b) => a.name.localeCompare(b.name));
    return `<div class="screen"><div><div class="eyebrow">${t("add")}</div><h2>${t("addTitle")}</h2></div>
      <form class="form" id="reviewForm">
        <label for="f-rid">${t("place")}<select id="f-rid" required><option value="">${t("choose")}</option>
          ${sorted.map(r => `<option value="${esc(r.id)}" ${d.rid === r.id ? "selected" : ""}>${esc(r.name)} · ${areaName(r.area)}</option>`).join("")}</select></label>
        <button type="button" class="linkbtn" data-view="newplace" style="align-self:flex-start">${t("addPlace")}</button>
        <label for="f-dish">${t("dish")}<input type="text" id="f-dish" maxlength="80" placeholder="${t("dishPh")}" value="${esc(d.dish)}"></label>
        <label for="f-body">${t("yourTake")}<textarea id="f-body" maxlength="2000" placeholder="${t("takePh")}">${esc(d.body)}</textarea></label>
        <div class="upload"><b>${t("photos")}</b><span class="meta">${t("photosHint")}</span>
          <input type="file" id="f-photos" accept="image/*" multiple>
          <div class="previews" id="previews">${d.previews.map(s => `<img src="${s}" alt="">`).join("")}</div></div>
        <button class="btn" type="submit">${t("next")}</button>
      </form></div>`;
  }
  const r = (state.restList || []).find(x => x.id === d.rid) || await api.restaurant(d.rid);
  if (d.step === 2) {
    return `<div class="screen"><button class="back" data-step="1">‹ ${t("back")}</button>
      <div><div class="eyebrow">${esc(r.name)}</div><h2>${t("howWas")}</h2></div>
      <div class="feel">
        <button data-feel="loved"><span class="dot" style="background:var(--good)"></span>${t("loved")}</button>
        <button data-feel="fine"><span class="dot" style="background:var(--gold)"></span>${t("fine")}</button>
        <button data-feel="bad"><span class="dot" style="background:var(--bad)"></span>${t("bad")}</button>
      </div></div>`;
  }
  if (d.step === 3) {
    const other = d.list[Math.floor((d.lo + d.hi) / 2)];
    const total = Math.max(1, Math.ceil(Math.log2(d.list.length + 1)));
    return `<div class="screen"><div><div class="eyebrow">${esc(r.name)}</div><h2>${t("compare")}</h2>
        <p class="muted" style="margin:6px 0 0">${t("compareHint")}</p></div>
      <div class="progress"><div style="width:${Math.min(100, d.asked / total * 100)}%"></div></div>
      <div class="vs">
        <button data-pick="new"><div class="thumb" style="${d.previews[0] ? `background-image:url(${d.previews[0]})` : grad(r.id)}"></div><b>${esc(r.name)}</b><span class="meta">${esc(d.dish || r.signature_dish || "")}</span></button>
        <em>vs</em>
        <button data-pick="old"><div class="thumb" style="${grad(other.id)}"></div><b>${esc(other.name)}</b><span class="meta">${areaName(other.area)}</span></button>
      </div></div>`;
  }
  if (d.step === "posting") return `<div class="screen"><div class="center">${t("posting")}</div></div>`;
  if (d.step === "failed") return `<div class="screen"><div class="center"><p class="error">${t("postFailed")}</p><button class="btn" data-repost>${t("retry")}</button></div></div>`;
  return `<div class="screen"><div class="done">
      <div class="eyebrow">${t("newScore")} ${esc(r.name)}</div>
      <div class="big-score">${fmtScore(d.score)}</div>
      <p class="muted" style="margin:0">${t("posted")}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn" data-goto="feed">${t("seeFeed")}</button>
        <button class="btn ghost" data-new>${t("another")}</button></div></div></div>`;
}

async function screenNewPlace() {
  if (!api.user) return needSignIn();
  return `<div class="screen"><button class="back" data-back>‹ ${t("back")}</button>
    <div><h2>${t("addPlace")}</h2><p class="muted" style="margin:6px 0 0">${t("addPlaceSub")}</p></div>
    <form class="form" id="placeForm">
      <label for="p-name">${t("placeName")}<input type="text" id="p-name" required maxlength="80"></label>
      <label for="p-area">${t("area")}<select id="p-area" required>${Object.keys(AREAS).map(k => `<option value="${k}">${areaName(k)}</option>`).join("")}</select></label>
      <label for="p-cuisine">${t("cuisine")}<input type="text" id="p-cuisine" maxlength="60" placeholder="${t("cuisinePh")}"></label>
      <label for="p-price">${t("price")}<select id="p-price">${[1,2,3,4].map(p => `<option value="${p}">${"৳".repeat(p)}</option>`).join("")}</select></label>
      <label for="p-dish">${t("dishKnown")}<input type="text" id="p-dish" maxlength="60"></label>
      <p class="error" id="p-error" hidden></p>
      <button class="btn" type="submit">${t("addPlaceBtn")}</button>
    </form></div>`;
}

async function screenGuide() {
  const all = await api.restaurants();
  const awarded = all.filter(r => r.plates > 0);
  const hero = `<div class="guide-hero"><div class="eyebrow">${t("guideKicker")}</div><h2>${t("guideTitle")}</h2>
      <p class="muted" style="margin:0;max-width:34ch">${t("guideSub")}</p></div>`;
  const legend = `<div class="legend"><h3>${t("howWorks")}</h3>
      ${["hw1","hw2","hw3"].map((k, i) => `<div><span class="eyebrow" style="color:var(--red)">${num(i + 1)}</span><span>${t(k)}</span></div>`).join("")}</div>`;
  if (!awarded.length) {
    const top = all.filter(r => r.score != null).slice(0, 10);
    return `<div class="screen">${hero}<p class="muted" style="margin:0">${t("guideSoon")}</p>
      <section class="tier"><div class="tier-head"><h3>${t("topRated")}</h3></div>
      <div class="list" style="border-top:0">${top.length ? top.map(restRow).join("") : `<p class="muted">${t("noneYet")}</p>`}</div></section>${legend}</div>`;
  }
  return `<div class="screen">${hero}
    ${[3,2,1].map(n => { const tier = awarded.filter(r => r.plates === n); return tier.length ? `<section class="tier"><div class="tier-head">${plates(n)}<div><h3>${t("t" + n)}</h3><div class="meta">${t("t" + n + "d")}</div></div></div>
      <div class="list" style="border-top:0">${tier.map(restRow).join("")}</div></section>` : ""; }).join("")}
    ${legend}</div>`;
}

async function screenMe() {
  if (!api.user) {
    return `<div class="screen"><div><h2>${t("signInTitle")}</h2><p class="muted" style="margin:6px 0 0">${t("signInSub")}</p></div>
      ${state.sentLink ? `<p>${t("checkEmail")}</p>` : `<form class="form" id="signinForm">
        <label for="s-email">${t("email")}<input type="email" id="s-email" required autocomplete="email"></label>
        <p class="error" id="s-error" hidden></p>
        <button class="btn" type="submit">${t("sendLink")}</button></form>`}</div>`;
  }
  const [prof, ranks, count] = await Promise.all([api.profile(), api.rankings(), api.myReviewCount()]);
  state.ranks = ranks;
  const all = [...ranks.loved, ...ranks.fine, ...ranks.bad];
  const name = prof?.display_name || "";
  return `<div class="screen">
    <div style="display:flex;align-items:center;gap:14px"><div class="avatar" style="width:56px;height:56px;font-size:22px">${esc((name || "?")[0].toUpperCase())}</div>
      <div><h2 style="font-size:22px">${esc(name)}</h2><span class="cred ${prof?.trusted ? "" : "new"}">${prof?.trusted ? t("credTrusted") : t("credNew")}</span></div></div>
    <div class="stats"><div><strong>${num(all.length)}</strong><small>${t("ranked")}</small></div>
      <div><strong>${num(count)}</strong><small>${t("reviewsN")}</small></div>
      <div><strong>${num(state.saved.size)}</strong><small>${t("savedN")}</small></div></div>
    <div><h3>${t("myRanks")}</h3>
      ${all.length ? all.map((r, i) => `<div class="rank"><span class="n">${num(i + 1)}</span>
        <div class="thumb" style="${grad(r.id)};width:44px;height:44px"></div>
        <div class="info"><button class="rname" data-rid="${esc(r.id)}" style="font-size:16px">${esc(r.name)}</button><div class="meta">${areaName(r.area)}</div></div>
        <div class="score ${sClass(r.score)}">${fmtScore(r.score)}</div></div>`).join("") : `<p class="muted">${t("noneYet")}</p>`}
    </div>
    ${LIVE ? `<button class="btn ghost" data-signout style="align-self:flex-start">${t("signOut")}</button>` : ""}
  </div>`;
}

/* ------------------------------ Render ------------------------------ */
let renderSeq = 0;
async function render({ keepScroll = false } = {}) {
  const seq = ++renderSeq;
  document.documentElement.lang = state.lang;
  $("#tagline").textContent = t("tagline");
  $("#lang-en").setAttribute("aria-pressed", state.lang === "en");
  $("#lang-bn").setAttribute("aria-pressed", state.lang === "bn");
  const banner = $("#banner"); banner.hidden = LIVE; if (!LIVE) banner.textContent = t("demo");
  renderTabs();
  const fn = state.view === "newplace" ? screenNewPlace : state.rid ? screenRestaurant
    : { feed: screenFeed, explore: screenExplore, add: screenAdd, guide: screenGuide, me: screenMe }[state.tab];
  const main = $("#main");
  const y = scrollY;
  if (!keepScroll) main.innerHTML = loading();
  try {
    const html = await fn();
    if (seq !== renderSeq) return;
    main.innerHTML = html;
    if (keepScroll) scrollTo(0, y);
  } catch (err) {
    console.error(err);
    if (seq === renderSeq) main.innerHTML = failed();
  }
}
function renderTabs() {
  $("#tabs").innerHTML = ["feed","explore","add","guide","me"].map(k =>
    `<button class="${k === "add" ? "add" : ""}" data-tab="${k}" ${state.tab === k && !state.rid && !state.view ? 'aria-current="page"' : ""}>${k === "add" ? `<span class="plus">${ICON.add}</span>` : ICON[k]}<span>${t(k)}</span></button>`).join("");
}
function go(tab) { state.tab = tab; state.rid = null; state.view = null; render(); scrollTo(0, 0); }

/* ---------------------------- Review flow ---------------------------- */
async function startCompare(bucket) {
  const d = state.draft;
  const ranks = state.ranks || (state.ranks = await api.rankings());
  d.bucket = bucket;
  d.list = ranks[bucket].filter(x => x.id !== d.rid);
  d.lo = 0; d.hi = d.list.length; d.asked = 0;
  if (d.lo >= d.hi) return finish(); else d.step = 3;
  render();
}
async function finish() {
  const d = state.draft, ranks = state.ranks;
  const r = (state.restList || []).find(x => x.id === d.rid) || await api.restaurant(d.rid);
  for (const b of Object.keys(ranks)) ranks[b] = ranks[b].filter(x => x.id !== d.rid);
  ranks[d.bucket].splice(d.lo, 0, { id: r.id, name: r.name, area: r.area, score: 0 });
  for (const b of Object.keys(ranks)) ranks[b].forEach((x, i, arr) => x.score = scoreFor(b, i, arr.length));
  d.score = ranks[d.bucket].find(x => x.id === d.rid).score;
  await post();
}
async function post() {
  const d = state.draft;
  d.step = "posting"; render();
  try {
    await api.saveRankings(state.ranks);
    await api.postReview({ restaurantId: d.rid, dish: d.dish, body: d.body, bucket: d.bucket, score: d.score, files: d.files, previews: d.previews });
    d.step = 4;
  } catch (err) { console.error(err); d.step = "failed"; }
  render();
}

/* ------------------------------ Events ------------------------------ */
document.addEventListener("click", async e => {
  const b = e.target.closest("button,[data-area]"); if (!b) return;
  const ds = b.dataset;
  if (b.id === "lang-en" || b.id === "lang-bn") { state.lang = b.id === "lang-bn" ? "bn" : "en"; try { localStorage.setItem("palate-lang", state.lang); } catch (_) {} render({ keepScroll: true }); return; }
  if (ds.tab) return go(ds.tab);
  if (ds.retry !== undefined) return render();
  if (ds.rid) { state.rid = ds.rid; state.view = null; render(); scrollTo(0, 0); return; }
  if (ds.back !== undefined) { if (state.view) state.view = null; else state.rid = null; render(); return; }
  if (ds.view) { state.view = ds.view; render(); scrollTo(0, 0); return; }
  if (ds.sort) { state.sort = ds.sort; render(); return; }
  if (ds.area !== undefined) { state.area = ds.area || null; render({ keepScroll: true }); return; }
  if (ds.like) {
    if (!api.user) return go("me");
    const p = state.posts?.find(x => x.id === ds.like); const on = !(p?.liked);
    if (p) { p.liked = on; p.like_count = (p.like_count || 0) + (on ? 1 : -1); }
    render({ keepScroll: true });
    try { await api.setLike(ds.like, on); } catch (err) { toast(t("errorLoad")); }
    return;
  }
  if (ds.save) {
    if (!api.user) return go("me");
    const on = !state.saved.has(ds.save);
    on ? state.saved.add(ds.save) : state.saved.delete(ds.save);
    render({ keepScroll: true });
    try { await api.setSave(ds.save, on); } catch (err) { toast(t("errorLoad")); }
    return;
  }
  if (ds.review) { state.draft = { step: 1, rid: ds.review, dish: "", body: "", files: [], previews: [] }; return go("add"); }
  if (ds.step) { state.draft.step = +ds.step; render(); return; }
  if (ds.feel) return startCompare(ds.feel);
  if (ds.pick) {
    const d = state.draft, mid = Math.floor((d.lo + d.hi) / 2);
    if (ds.pick === "new") d.hi = mid; else d.lo = mid + 1;
    d.asked++;
    if (d.lo >= d.hi) return finish();
    render(); return;
  }
  if (ds.repost !== undefined) return post();
  if (ds.goto) { state.draft = null; state.ranks = null; go(ds.goto); toast(t("posted")); return; }
  if (ds.new !== undefined) { state.draft = null; render(); return; }
  if (ds.signout !== undefined) { await api.signOut(); state.saved = new Set(); state.ranks = null; go("feed"); return; }
});
document.addEventListener("keydown", e => {
  const g = e.target.closest?.("g[data-area]");
  if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); state.area = state.area === g.dataset.area ? null : g.dataset.area; render({ keepScroll: true }); }
});
document.addEventListener("input", e => {
  const d = state.draft; if (!d) return;
  if (e.target.id === "f-dish") d.dish = e.target.value;
  if (e.target.id === "f-body") d.body = e.target.value;
});
document.addEventListener("change", async e => {
  if (e.target.id === "f-rid") state.draft.rid = e.target.value;
  if (e.target.id === "f-photos") {
    const d = state.draft, files = [...e.target.files].slice(0, 4);
    d.files = []; d.previews = [];
    for (const f of files) {
      try {
        const blob = await compressImage(f, LIVE ? 1280 : 480, LIVE ? 0.75 : 0.6);
        d.files.push(blob);
        d.previews.push(await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); }));
      } catch (err) { console.error(err); }
    }
    $("#previews").innerHTML = d.previews.map(s => `<img src="${s}" alt="">`).join("");
  }
});
document.addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === "reviewForm") {
    const d = state.draft; d.rid = $("#f-rid").value;
    if (!d.rid) { $("#f-rid").focus(); return; }
    d.step = 2; render(); scrollTo(0, 0);
  }
  if (f.id === "signinForm") {
    const email = $("#s-email").value.trim(), err = $("#s-error");
    try { await api.signIn(email); state.sentLink = true; render(); }
    catch (x) { err.textContent = x.message || t("errorLoad"); err.hidden = false; }
  }
  if (f.id === "placeForm") {
    const err = $("#p-error");
    try {
      const r = await api.addRestaurant({ name: $("#p-name").value.trim(), area: $("#p-area").value,
        cuisine_en: $("#p-cuisine").value.trim() || null, price: +$("#p-price").value, signature_dish: $("#p-dish").value.trim() || null });
      state.restList = null; toast(t("placeAdded"));
      if (state.draft && state.tab === "add") { state.draft.rid = r.id; state.view = null; render(); }
      else { state.view = null; state.rid = r.id; render(); }
    } catch (x) { err.textContent = x.message || t("errorLoad"); err.hidden = false; }
  }
});

/* ------------------------------- Start ------------------------------- */
api.onAuth(async () => { state.saved = await api.saves().catch(() => new Set()); state.ranks = null; state.sentLink = false; render(); });
api.saves().then(s => { state.saved = s; }).catch(() => {}).finally(() => render());
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
