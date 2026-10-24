import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AREAS = {
  uttara: { en: "Uttara", bn: "উত্তরা" },
  bashundhara: { en: "Bashundhara", bn: "বসুন্ধরা" },
  gulshan: { en: "Gulshan", bn: "গুলশান" },
  banani: { en: "Banani", bn: "বনানী" },
  mohammadpur: { en: "Mohammadpur", bn: "মোহাম্মদপুর" },
  dhanmondi: { en: "Dhanmondi", bn: "ধানমন্ডি" },
  olddhaka: { en: "Old Dhaka", bn: "পুরান ঢাকা" },
  other: { en: "Elsewhere", bn: "অন্যান্য" },
};

const S = {
  en: {
    feed: "Feed", explore: "Explore", review: "Review", guide: "Guide", me: "Me",
    forYou: "For you", following: "Following",
    whereTheyEat: "Where They Eat", whereTheyEatSub: "Famous faces take us to their favourite spot",
    favourite: "Favourite", loading: "Loading…", errorLoad: "Couldn't load this. Check your internet and try again.", retry: "Try again",
    emptyFollowing: "Follow critics to see where they eat. Start with the top critics in Explore.",
    emptyFeed: "No reviews yet. Be the first to review a place in Dhaka.",
    likes: "Likes", helpful: "Helpful", save: "Save", saved: "Saved", report: "Report",
    reported: "Thanks. Our team will check this review.", verifiedVisit: "Verified visit",
    critic: "Critic", club: "Club", admin: "Palate team",
    searchPh: "Search restaurants or dishes", places: "Places", dishes: "Dishes", allAreas: "All of Dhaka",
    topCritics: "Top critics", bestOf: "Best", noResults: "Nothing found. Try another search or area.",
    palateScore: "Palate score", criticScore: "Critics", cleanliness: "Cleanliness", perPerson: "per person",
    reviewsN: "reviews", googleRating: "Google", writeReview: "Write a review", whatPeopleSay: "Reviews",
    criticsFirst: "Critic reviews count 3× in the Palate score.",
    takaPick: "Taka Pick", takaPickSub: "Great food under ৳1,000 per person",
    guideKicker: "The Palate Guide", guideTitle: "Dhaka 2027",
    guideSub: "Plates are awarded on the scores of Palate Critics, then confirmed by an anonymous visit. Restaurants can never pay for a rating.",
    plates3: "Three plates", plates3d: "Worth crossing Dhaka in traffic for.",
    plates2: "Two plates", plates2d: "Worth a special trip to the area.",
    plates1: "One plate", plates1d: "A reliably excellent meal.",
    dishOfTheCity: "Best in the city", platesTab: "Plates", howItWorks: "How the Guide works",
    hw1: "Only Palate Critics' scores count towards plates. Critic status is earned, never bought.",
    hw2: "A place needs consistent critic reviews over the last 12 months.",
    hw3: "An anonymous Palate visit confirms every award before it's published.",
    signInTitle: "Join Palate", signInSub: "Rank places, follow critics and earn your way to Palate Critic.",
    email: "Email", sendCode: "Send me a code", code: "Code from your email", verify: "Sign in",
    codeSent: "We emailed a sign-in code to", changeEmail: "Use another email", createAccount: "Create account", emailCode: "Email me a code", password: "Password", passwordShort: "At least 8 characters", confirmEmail: "Account created. Tap the confirmation link we emailed you, then sign in here.", signOut: "Sign out",
    needSignIn: "Sign in to write reviews.", goSignIn: "Sign in",
    rankings: "Rankings", reviewsTab: "Reviews", savedTab: "Saved", followers: "Followers", followingN: "Following",
    follow: "Follow", unfollow: "Following", whereTheyGo: "Where they eat",
    tasteTwins: "Taste twins", tasteTwinsSub: "People whose rankings match yours",
    twinsEmpty: "Rank at least 2 places to find your taste twins.", match: "match", inCommon: "places in common",
    clubTitle: "Palate Club", clubSub: "For people who take food seriously",
    clubPerks1: "Early access to the Palate Guide and award nominees",
    clubPerks2: "Member prices at partner restaurants",
    clubPerks3: "Invites to tasting nights and food walks",
    clubPerks4: "Club badge and no ads, ever",
    clubNote: "Club doesn't make your reviews count more. Critic status is earned separately.",
    clubTest: "Start free test month", clubTestNote: "Test mode: no payment is taken.",
    clubActive: "You're a Club member until", clubEnd: "End test membership",
    criticTitle: "Become a Palate Critic", criticSub: "Critics' scores count 3× and decide the Guide. You earn it with honest, detailed reviews.",
    reqReviews: "Reviews written", reqPhotos: "Reviews with photos", reqVerified: "Verified visits", reqHelpful: "Helpful votes from others",
    applyNow: "Apply to be a critic", applyPh: "Tell us what you eat and why people should trust your taste.",
    applied: "Application sent. The Palate team will review it.", pending: "Your application is being reviewed.",
    youAreCritic: "You're a Palate Critic.", keepGoing: "Keep reviewing to unlock your application.",
    reviewTitle: "Write a review", place: "Where did you eat?", choosePlace: "Search restaurants",
    addPlace: "Add a new restaurant", dish: "What did you eat?", dishOther: "Something else",
    yourReview: "Your review", reviewPh: "Taste, portion, service, value. Be honest — it helps everyone.",
    cleanQ: "How clean was it?", spentQ: "How much did you spend per person? (৳)",
    photos: "Food photos", addPhotos: "Add photos", receipt: "Receipt (optional)",
    receiptSub: "Add your receipt to get a Verified visit tick. Only the Palate team sees it.", addReceipt: "Add receipt",
    next: "Next", howWas: "How was it overall?", loved: "Loved it", fine: "It was fine", bad: "Didn't like it",
    compare: "Which did you enjoy more?", compareHint: "Comparing with places you've ranked makes your score more accurate than stars.",
    posting: "Posting your review…", postFailed: "Your review didn't post. Check your internet and try again.",
    yourScore: "Your score", posted: "Review posted", seeIt: "See the restaurant", another: "Write another",
    newPlaceTitle: "Add a restaurant", name: "Restaurant name", area: "Area", cuisine: "Cuisine", cuisinePh: "e.g. Biryani, Cafe, Chinese",
    priceLevel: "Price", avgCost: "Typical spend per person (৳)", addPlaceBtn: "Add restaurant", placeAdded: "Restaurant added",
    required: "Please fill this in.", back: "Back", seeAll: "See all", progress: "progress",
    noneYet: "Nothing here yet.", you: "You",
  },
  bn: {
    feed: "ফিড", explore: "খুঁজুন", review: "রিভিউ", guide: "গাইড", me: "আমি",
    forYou: "আপনার জন্য", following: "ফলো করছি",
    whereTheyEat: "যেখানে তারা খান", whereTheyEatSub: "পরিচিত মুখেরা নিয়ে যান তাদের প্রিয় জায়গায়",
    favourite: "প্রিয়", loading: "লোড হচ্ছে…", errorLoad: "লোড করা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।", retry: "আবার চেষ্টা করুন",
    emptyFollowing: "ক্রিটিকদের ফলো করুন, দেখুন তারা কোথায় খান। খুঁজুন ট্যাবে সেরা ক্রিটিকদের পাবেন।",
    emptyFeed: "এখনো কোনো রিভিউ নেই। ঢাকার কোনো জায়গার প্রথম রিভিউ আপনিই লিখুন।",
    likes: "লাইক", helpful: "উপকারী", save: "সেভ", saved: "সেভ হয়েছে", report: "রিপোর্ট",
    reported: "ধন্যবাদ। আমাদের টিম রিভিউটি দেখবে।", verifiedVisit: "যাচাই করা ভিজিট",
    critic: "ক্রিটিক", club: "ক্লাব", admin: "প্যালেট টিম",
    searchPh: "রেস্টুরেন্ট বা খাবার খুঁজুন", places: "জায়গা", dishes: "খাবার", allAreas: "পুরো ঢাকা",
    topCritics: "সেরা ক্রিটিক", bestOf: "সেরা", noResults: "কিছু পাওয়া যায়নি। অন্যভাবে খুঁজে দেখুন।",
    palateScore: "প্যালেট স্কোর", criticScore: "ক্রিটিক", cleanliness: "পরিচ্ছন্নতা", perPerson: "জনপ্রতি",
    reviewsN: "রিভিউ", googleRating: "গুগল", writeReview: "রিভিউ লিখুন", whatPeopleSay: "রিভিউ",
    criticsFirst: "প্যালেট স্কোরে ক্রিটিকদের রিভিউ ৩ গুণ গণনা হয়।",
    takaPick: "টাকা পিক", takaPickSub: "জনপ্রতি ৳১,০০০-এর নিচে দারুণ খাবার",
    guideKicker: "প্যালেট গাইড", guideTitle: "ঢাকা ২০২৭",
    guideSub: "প্যালেট ক্রিটিকদের স্কোরে প্লেট দেওয়া হয়, তারপর গোপন ভিজিটে নিশ্চিত করা হয়। টাকা দিয়ে রেটিং কেনা যায় না।",
    plates3: "তিন প্লেট", plates3d: "জ্যাম ঠেলে ঢাকার ওপার থেকেও যাওয়ার মতো।",
    plates2: "দুই প্লেট", plates2d: "শুধু এর জন্য ওই এলাকায় যাওয়ার মতো।",
    plates1: "এক প্লেট", plates1d: "নিয়মিত চমৎকার খাবার।",
    dishOfTheCity: "শহরের সেরা", platesTab: "প্লেট", howItWorks: "গাইড যেভাবে কাজ করে",
    hw1: "শুধু প্যালেট ক্রিটিকদের স্কোর প্লেটে গণনা হয়। ক্রিটিক হতে হয় যোগ্যতায়, টাকায় নয়।",
    hw2: "গত ১২ মাসে নিয়মিত ক্রিটিক রিভিউ থাকতে হবে।",
    hw3: "প্রকাশের আগে প্যালেটের গোপন ভিজিটে প্রতিটি পুরস্কার নিশ্চিত হয়।",
    signInTitle: "প্যালেটে যোগ দিন", signInSub: "জায়গা র‍্যাঙ্ক করুন, ক্রিটিক ফলো করুন, যোগ্যতায় ক্রিটিক হয়ে উঠুন।",
    email: "ইমেইল", sendCode: "কোড পাঠান", code: "ইমেইলে পাওয়া কোড", verify: "সাইন ইন",
    codeSent: "সাইন-ইন কোড পাঠানো হয়েছে", changeEmail: "অন্য ইমেইল দিন", createAccount: "অ্যাকাউন্ট খুলুন", emailCode: "ইমেইলে কোড", password: "পাসওয়ার্ড", passwordShort: "কমপক্ষে ৮ অক্ষর", confirmEmail: "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইলে পাঠানো লিংকে ট্যাপ করে নিশ্চিত করুন, তারপর এখানে সাইন ইন করুন।", signOut: "সাইন আউট",
    needSignIn: "রিভিউ লিখতে সাইন ইন করুন।", goSignIn: "সাইন ইন",
    rankings: "র‍্যাঙ্কিং", reviewsTab: "রিভিউ", savedTab: "সেভ করা", followers: "ফলোয়ার", followingN: "ফলো করছেন",
    follow: "ফলো", unfollow: "ফলো করছেন", whereTheyGo: "যেখানে খান",
    tasteTwins: "টেস্ট টুইন", tasteTwinsSub: "যাদের র‍্যাঙ্কিং আপনার সাথে মেলে",
    twinsEmpty: "টেস্ট টুইন খুঁজতে অন্তত ২টি জায়গা র‍্যাঙ্ক করুন।", match: "মিল", inCommon: "টি জায়গা একসাথে",
    clubTitle: "প্যালেট ক্লাব", clubSub: "যারা খাবারকে গুরুত্ব দেন তাদের জন্য",
    clubPerks1: "প্যালেট গাইড ও মনোনয়ন আগে দেখুন",
    clubPerks2: "পার্টনার রেস্টুরেন্টে মেম্বার প্রাইস",
    clubPerks3: "টেস্টিং নাইট ও ফুড ওয়াকে আমন্ত্রণ",
    clubPerks4: "ক্লাব ব্যাজ, কোনো বিজ্ঞাপন নেই",
    clubNote: "ক্লাবে রিভিউর গুরুত্ব বাড়ে না। ক্রিটিক হতে হয় আলাদাভাবে যোগ্যতায়।",
    clubTest: "এক মাস ফ্রি টেস্ট শুরু করুন", clubTestNote: "টেস্ট মোড: কোনো টাকা নেওয়া হবে না।",
    clubActive: "আপনি ক্লাব মেম্বার, মেয়াদ", clubEnd: "টেস্ট মেম্বারশিপ বন্ধ করুন",
    criticTitle: "প্যালেট ক্রিটিক হোন", criticSub: "ক্রিটিকদের স্কোর ৩ গুণ গণনা হয় এবং গাইড ঠিক করে। সৎ ও বিস্তারিত রিভিউ দিয়ে এটি অর্জন করতে হয়।",
    reqReviews: "লেখা রিভিউ", reqPhotos: "ছবিসহ রিভিউ", reqVerified: "যাচাই করা ভিজিট", reqHelpful: "অন্যদের উপকারী ভোট",
    applyNow: "ক্রিটিক হতে আবেদন করুন", applyPh: "আপনি কী খান এবং কেন মানুষ আপনার রুচিতে ভরসা করবে, লিখুন।",
    applied: "আবেদন পাঠানো হয়েছে। প্যালেট টিম দেখবে।", pending: "আপনার আবেদন যাচাই করা হচ্ছে।",
    youAreCritic: "আপনি একজন প্যালেট ক্রিটিক।", keepGoing: "আবেদন খুলতে রিভিউ লিখতে থাকুন।",
    reviewTitle: "রিভিউ লিখুন", place: "কোথায় খেয়েছেন?", choosePlace: "রেস্টুরেন্ট খুঁজুন",
    addPlace: "নতুন রেস্টুরেন্ট যোগ করুন", dish: "কী খেয়েছেন?", dishOther: "অন্য কিছু",
    yourReview: "আপনার রিভিউ", reviewPh: "স্বাদ, পরিমাণ, সার্ভিস, দাম। সৎ থাকুন — এতে সবার উপকার।",
    cleanQ: "কতটা পরিষ্কার ছিল?", spentQ: "জনপ্রতি কত খরচ হয়েছে? (৳)",
    photos: "খাবারের ছবি", addPhotos: "ছবি যোগ করুন", receipt: "রসিদ (ঐচ্ছিক)",
    receiptSub: "রসিদ দিলে যাচাই করা ভিজিট টিক পাবেন। শুধু প্যালেট টিম দেখবে।", addReceipt: "রসিদ যোগ করুন",
    next: "পরবর্তী", howWas: "সব মিলিয়ে কেমন ছিল?", loved: "দারুণ লেগেছে", fine: "মোটামুটি", bad: "ভালো লাগেনি",
    compare: "কোনটা বেশি ভালো লেগেছে?", compareHint: "আগের জায়গাগুলোর সাথে তুলনা করলে স্টারের চেয়ে স্কোর বেশি সঠিক হয়।",
    posting: "রিভিউ পোস্ট হচ্ছে…", postFailed: "রিভিউ পোস্ট হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।",
    yourScore: "আপনার স্কোর", posted: "রিভিউ পোস্ট হয়েছে", seeIt: "রেস্টুরেন্ট দেখুন", another: "আরেকটি লিখুন",
    newPlaceTitle: "রেস্টুরেন্ট যোগ করুন", name: "রেস্টুরেন্টের নাম", area: "এলাকা", cuisine: "খাবারের ধরন", cuisinePh: "যেমন: বিরিয়ানি, ক্যাফে, চাইনিজ",
    priceLevel: "দাম", avgCost: "জনপ্রতি সাধারণ খরচ (৳)", addPlaceBtn: "রেস্টুরেন্ট যোগ করুন", placeAdded: "রেস্টুরেন্ট যোগ হয়েছে",
    required: "এটি পূরণ করুন।", back: "ফিরে যান", seeAll: "সব দেখুন", progress: "অগ্রগতি",
    noneYet: "এখনো কিছু নেই।", you: "আপনি",
  },
};

const LangContext = createContext({ lang: "en", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("en");
  useEffect(() => { AsyncStorage.getItem("palate-lang").then((v) => v && setLangState(v)).catch(() => {}); }, []);
  const setLang = (v) => { setLangState(v); AsyncStorage.setItem("palate-lang", v).catch(() => {}); };
  const t = (k) => S[lang][k] ?? S.en[k] ?? k;
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function useFormat() {
  const { lang } = useLang();
  const num = (v) => (lang === "bn" ? String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]) : String(v));
  const score = (s) => (s == null ? "–" : num(Number(s).toFixed(1)));
  const taka = (v) => (v == null ? "–" : "৳" + num(Number(v).toLocaleString("en-US")));
  const area = (a) => AREAS[a]?.[lang] ?? (a ? a[0].toUpperCase() + a.slice(1) : "");
  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    const u = lang === "bn" ? ["মি", "ঘ", "দি"] : ["m", "h", "d"];
    return m < 60 ? num(m) + u[0] : m < 1440 ? num(Math.round(m / 60)) + u[1] : num(Math.round(m / 1440)) + u[2];
  };
  const cuisine = (r) => (lang === "bn" && r?.cuisine_bn) || r?.cuisine_en || "";
  const dishName = (d) => (lang === "bn" && d?.name_bn) || d?.name_en || "";
  return { num, score, taka, area, ago, cuisine, dishName };
}
