import { useEffect, useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Badge, Button, Chip, Empty, ErrorState, Ionicons, Loading, Row, Screen, ScoreBadge, T, styles, useAsync } from "../../lib/ui";
import { useAuth } from "../../lib/auth";
import { useFormat, useLang } from "../../lib/i18n";
import { useTheme } from "../../lib/theme";
import { getDishes, getRankings, getRestaurants, postReview, saveRankings, scoreFor } from "../../lib/api";
import { notify } from "../../lib/actions";

const fresh = (rid) => ({ step: 1, restaurant: null, rid: rid || null, dishId: null, dishName: "", other: false, body: "", cleanliness: 0, spent: "", photos: [], receipt: null });

export default function Review() {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [d, setD] = useState(fresh(params.restaurant));
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const set = (patch) => setD((x) => ({ ...x, ...patch }));

  const places = useAsync(() => getRestaurants(), []);
  const dishes = useAsync(getDishes, []);
  useEffect(() => { if (params.restaurant && params.restaurant !== d.rid) setD(fresh(params.restaurant)); }, [params.restaurant]);
  useEffect(() => {
    if (d.rid && !d.restaurant && places.data) { const r = places.data.find((x) => x.id === d.rid); if (r) set({ restaurant: r }); }
  }, [d.rid, places.data]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (places.data || []).filter((r) => !q || r.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, places.data]);

  if (!user) {
    return (
      <Screen>
        <T v="display">{t("reviewTitle")}</T>
        <Empty text={t("needSignIn")} action={<Button title={t("goSignIn")} onPress={() => router.push("/sign-in")} />} />
      </Screen>
    );
  }

  const pick = async (key) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsMultipleSelection: key === "photos", selectionLimit: key === "photos" ? 4 : 1, quality: 0.5, base64: true,
    });
    if (res.canceled) return;
    if (key === "photos") set({ photos: res.assets.slice(0, 4) });
    else set({ receipt: res.assets[0] });
  };

  /* ---------- Step 1: details ---------- */
  if (d.step === 1) {
    const next = () => {
      if (!d.restaurant) { setError(t("place") + " — " + t("required")); return; }
      setError(""); set({ step: 2 });
    };
    return (
      <Screen>
        <T v="display">{t("reviewTitle")}</T>

        <View style={{ gap: 8 }}>
          <T v="h3">{t("place")}</T>
          {d.restaurant ? (
            <Row style={{ backgroundColor: c.surface, borderRadius: 18, padding: 10 }}>
              <Image source={d.restaurant.cover_url ? { uri: d.restaurant.cover_url } : null} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: c.surfaceAlt }} />
              <View style={{ flex: 1 }}>
                <T v="h3">{d.restaurant.name}</T>
                <T v="small" muted>{f.area(d.restaurant.area)}</T>
              </View>
              <Pressable onPress={() => set({ restaurant: null, rid: null })} accessibilityLabel="Change"><Ionicons name="close-circle" size={22} color={c.muted} /></Pressable>
            </Row>
          ) : (
            <View style={{ backgroundColor: c.surface, borderRadius: 18, overflow: "hidden" }}>
              <TextInput value={query} onChangeText={setQuery} placeholder={t("choosePlace")} placeholderTextColor={c.muted}
                style={[styles.input, { color: c.ink, borderBottomWidth: 1, borderBottomColor: c.line }]} accessibilityLabel={t("choosePlace")} />
              {places.loading ? <Loading /> : places.error ? <ErrorState onRetry={places.reload} /> : matches.map((r) => (
                <Pressable key={r.id} onPress={() => { set({ restaurant: r, rid: r.id }); setQuery(""); }} style={{ paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.line }}>
                  <T v="bodyBold">{r.name}</T>
                  <T v="small" muted>{f.area(r.area)}</T>
                </Pressable>
              ))}
              <Pressable onPress={() => router.push("/new-place")} style={{ flexDirection: "row", gap: 8, alignItems: "center", padding: 14 }}>
                <Ionicons name="add-circle" size={18} color={c.primary} />
                <T v="bodyBold" color={c.primary}>{t("addPlace")}</T>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <T v="h3">{t("dish")}</T>
          <Row gap={8} wrap>
            {(dishes.data || []).map((x) => <Chip key={x.id} label={f.dishName(x)} active={d.dishId === x.id} onPress={() => set({ dishId: x.id, dishName: x.name_en, other: false })} />)}
            <Chip label={t("dishOther")} active={d.other} onPress={() => set({ other: true, dishId: null, dishName: "" })} />
          </Row>
          {d.other ? <TextInput value={d.dishName} onChangeText={(v) => set({ dishName: v })} maxLength={80} placeholder={t("dish")} placeholderTextColor={c.muted} style={[styles.input, { color: c.ink, backgroundColor: c.surface }]} /> : null}
        </View>

        <View style={{ gap: 8 }}>
          <T v="h3">{t("yourReview")}</T>
          <TextInput value={d.body} onChangeText={(v) => set({ body: v })} multiline maxLength={2000} placeholder={t("reviewPh")} placeholderTextColor={c.muted}
            style={[styles.input, { color: c.ink, backgroundColor: c.surface, minHeight: 120, textAlignVertical: "top" }]} accessibilityLabel={t("yourReview")} />
        </View>

        <View style={{ gap: 8 }}>
          <T v="h3">{t("cleanQ")}</T>
          <Row gap={10}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => set({ cleanliness: n })} accessibilityLabel={`${n} of 5`}
                style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: d.cleanliness >= n ? c.good : c.surface }}>
                <Ionicons name="sparkles" size={18} color={d.cleanliness >= n ? "#FFFFFF" : c.muted} />
              </Pressable>
            ))}
          </Row>
        </View>

        <View style={{ gap: 8 }}>
          <T v="h3">{t("spentQ")}</T>
          <TextInput value={d.spent} onChangeText={(v) => set({ spent: v.replace(/[^0-9]/g, "") })} keyboardType="number-pad" placeholder="500" placeholderTextColor={c.muted}
            style={[styles.input, { color: c.ink, backgroundColor: c.surface, width: 160 }]} accessibilityLabel={t("spentQ")} />
        </View>

        <View style={{ gap: 8 }}>
          <T v="h3">{t("photos")}</T>
          <Row gap={8} wrap>
            {d.photos.map((p, i) => <Image key={i} source={{ uri: p.uri }} style={{ width: 76, height: 76, borderRadius: 14 }} />)}
            <Pressable onPress={() => pick("photos")} style={{ width: 76, height: 76, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: c.coral, alignItems: "center", justifyContent: "center" }} accessibilityLabel={t("addPhotos")}>
              <Ionicons name="camera" size={24} color={c.primary} />
            </Pressable>
          </Row>
        </View>

        <View style={{ gap: 8, backgroundColor: c.surface, borderRadius: 18, padding: 14 }}>
          <Row><Ionicons name="receipt" size={18} color={c.good} /><T v="h3">{t("receipt")}</T></Row>
          <T v="small" muted>{t("receiptSub")}</T>
          {d.receipt ? <Badge label={t("verifiedVisit") + " · pending"} tone="good" icon="time" /> : <Button small kind="soft" icon="add" title={t("addReceipt")} onPress={() => pick("receipt")} style={{ alignSelf: "flex-start" }} />}
        </View>

        {error ? <T color={c.danger}>{error}</T> : null}
        <Button title={t("next")} onPress={next} />
      </Screen>
    );
  }

  /* ---------- Step 2: feeling ---------- */
  const startCompare = async (bucket) => {
    try {
      const ranks = await getRankings(user.id);
      const list = ranks[bucket].filter((x) => x.id !== d.restaurant.id);
      const next = { ...d, bucket, ranks, list, lo: 0, hi: list.length, asked: 0 };
      if (list.length === 0) return finish(next);
      setD({ ...next, step: 3 });
    } catch { notify(t("errorLoad")); }
  };

  const finish = async (state) => {
    const ranks = state.ranks;
    for (const b of Object.keys(ranks)) ranks[b] = ranks[b].filter((x) => x.id !== state.restaurant.id);
    ranks[state.bucket].splice(state.lo, 0, { id: state.restaurant.id, name: state.restaurant.name, score: 0 });
    for (const b of Object.keys(ranks)) ranks[b].forEach((x, i, arr) => { x.score = scoreFor(b, i, arr.length); });
    const score = ranks[state.bucket].find((x) => x.id === state.restaurant.id).score;
    const ready = { ...state, ranks, score, step: "posting" };
    setD(ready);
    try {
      await saveRankings(user.id, ranks);
      await postReview(user.id, { restaurantId: ready.restaurant.id, dishId: ready.dishId, dishName: ready.dishName, body: ready.body, bucket: ready.bucket, score, cleanliness: ready.cleanliness, spent: ready.spent, photos: ready.photos, receipt: ready.receipt });
      setD({ ...ready, step: "done" });
    } catch (e) { console.warn(e); setD({ ...ready, step: "failed" }); }
  };

  if (d.step === 2) {
    const opts = [["loved", c.primary, "heart"], ["fine", c.accent, "remove-circle"], ["bad", c.coral, "thumbs-down"]];
    return (
      <Screen>
        <Pressable onPress={() => set({ step: 1 })}><T color={c.primary}>‹ {t("back")}</T></Pressable>
        <T v="eyebrow" muted>{d.restaurant.name}</T>
        <T v="display">{t("howWas")}</T>
        <View style={{ gap: 12 }}>
          {opts.map(([k, col, icon]) => (
            <Pressable key={k} onPress={() => startCompare(k)} style={({ pressed }) => ({ backgroundColor: col, borderRadius: 22, padding: 20, flexDirection: "row", alignItems: "center", gap: 14, opacity: pressed ? 0.85 : 1 })}>
              <Ionicons name={icon} size={26} color="#FFFFFF" />
              <T v="h2" color="#FFFFFF">{t(k)}</T>
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  /* ---------- Step 3: compare ---------- */
  if (d.step === 3) {
    const other = d.list[Math.floor((d.lo + d.hi) / 2)];
    const total = Math.max(1, Math.ceil(Math.log2(d.list.length + 1)));
    const choose = (which) => {
      const mid = Math.floor((d.lo + d.hi) / 2);
      const next = { ...d, asked: d.asked + 1, lo: which === "new" ? d.lo : mid + 1, hi: which === "new" ? mid : d.hi };
      if (next.lo >= next.hi) finish(next); else setD(next);
    };
    const Side = ({ name, img, sub, onPress }) => (
      <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, backgroundColor: c.surface, borderRadius: 22, overflow: "hidden", opacity: pressed ? 0.8 : 1 })}>
        <Image source={img ? { uri: img } : null} style={{ width: "100%", aspectRatio: 1, backgroundColor: c.surfaceAlt }} contentFit="cover" />
        <View style={{ padding: 12, gap: 2 }}>
          <T v="h3" numberOfLines={2}>{name}</T>
          <T v="small" muted numberOfLines={1}>{sub}</T>
        </View>
      </Pressable>
    );
    return (
      <Screen>
        <T v="eyebrow" muted>{d.restaurant.name}</T>
        <T v="display">{t("compare")}</T>
        <T muted>{t("compareHint")}</T>
        <View style={{ height: 6, backgroundColor: c.line, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ width: `${Math.min(100, (d.asked / total) * 100)}%`, height: "100%", backgroundColor: c.accent }} />
        </View>
        <Row gap={10} style={{ alignItems: "stretch" }}>
          <Side name={d.restaurant.name} img={d.photos[0]?.uri || d.restaurant.cover_url} sub={d.dishName || f.area(d.restaurant.area)} onPress={() => choose("new")} />
          <Side name={other.name} img={other.cover_url} sub={f.area(other.area)} onPress={() => choose("old")} />
        </Row>
      </Screen>
    );
  }

  /* ---------- Posting / result ---------- */
  if (d.step === "posting") return <Screen><Loading /><T muted style={{ textAlign: "center" }}>{t("posting")}</T></Screen>;
  if (d.step === "failed") {
    return (
      <Screen>
        <Empty text={t("postFailed")} action={<Button title={t("retry")} onPress={() => finish({ ...d, ranks: d.ranks })} />} />
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 14, paddingVertical: 30 }}>
        <T v="eyebrow" muted>{t("yourScore")}</T>
        <ScoreBadge score={d.score} size="lg" />
        <T v="h1" style={{ textAlign: "center" }}>{d.restaurant.name}</T>
        <T muted>{t("posted")}</T>
        <Button title={t("seeIt")} onPress={() => { const id = d.restaurant.id; setD(fresh()); router.push(`/restaurant/${id}`); }} />
        <Button kind="ghost" title={t("another")} onPress={() => setD(fresh())} />
      </View>
    </Screen>
  );
}
