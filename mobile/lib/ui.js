import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Rect } from "react-native-svg";
import { router } from "expo-router";
import { FONTS, PALETTE, scoreColors, useTheme } from "./theme";
import { useFormat, useLang } from "./i18n";

export { Ionicons };

/* ---------- Data loading ---------- */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const alive = useRef(true);
  const run = useCallback(async (quiet) => {
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try { const data = await loader(); if (alive.current) setState({ loading: false, error: null, data }); }
    catch (error) { console.warn(error); if (alive.current) setState((s) => ({ ...s, loading: false, error })); }
  }, deps);
  useEffect(() => { alive.current = true; run(); return () => { alive.current = false; }; }, [run]);
  return { ...state, reload: () => run(true), setData: (fn) => setState((s) => ({ ...s, data: typeof fn === "function" ? fn(s.data) : fn })) };
}

/* ---------- Text ---------- */
const sizes = {
  display: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.8 },
  h1: { fontFamily: FONTS.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.5 },
  h2: { fontFamily: FONTS.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
  h3: { fontFamily: FONTS.displayMid, fontSize: 16.5, lineHeight: 21 },
  body: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 22 },
  bodyBold: { fontFamily: FONTS.bodyBold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 18 },
  eyebrow: { fontFamily: FONTS.displayMid, fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase" },
};
export function T({ v = "body", color, muted, style, children, ...rest }) {
  const c = useTheme();
  const base = v === "display" || v.startsWith("h") ? c.heading : c.ink;
  return <Text {...rest} style={[sizes[v], { color: color || (muted ? c.muted : base) }, style]}>{children}</Text>;
}

/* ---------- Layout ---------- */
export function Screen({ children, scroll = true, onRefresh, padded = true, header }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = onRefresh ? async () => { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } } : undefined;
  const inner = <View style={{ paddingHorizontal: padded ? 18 : 0, paddingBottom: 40, gap: 18 }}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingTop: 12 }} keyboardShouldPersistTaps="handled"
          refreshControl={refresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} colors={[c.primary]} /> : undefined}>
          {inner}
        </ScrollView>
      ) : <View style={{ flex: 1, paddingTop: 12 }}>{inner}</View>}
    </View>
  );
}

export function BackBar({ title, right }) {
  const c = useTheme();
  const { t } = useLang();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, gap: 6 }}>
      <Pressable accessibilityLabel={t("back")} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: c.surface }}>
        <Ionicons name="chevron-back" size={22} color={c.heading} />
      </Pressable>
      <T v="h3" style={{ flex: 1 }} numberOfLines={1}>{title}</T>
      {right}
    </View>
  );
}

export function Row({ children, gap = 10, style, wrap }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap, flexWrap: wrap ? "wrap" : "nowrap" }, style]}>{children}</View>;
}

export function Card({ children, style, onPress }) {
  const c = useTheme();
  const S = onPress ? Pressable : View;
  return <S onPress={onPress} style={[{ backgroundColor: c.surface, borderRadius: 20, overflow: "hidden" }, style]}>{children}</S>;
}

/* ---------- Controls ---------- */
export function Button({ title, onPress, kind = "primary", disabled, loading, icon, style, small }) {
  const c = useTheme();
  const bg = { primary: c.primary, accent: c.accent, ghost: "transparent", soft: c.primarySoft }[kind];
  const fg = { primary: c.onPrimary, accent: "#FFFFFF", ghost: c.primary, soft: c.primary }[kind];
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button"
      style={({ pressed }) => [{
        backgroundColor: bg, borderRadius: 999, paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 14 : 22,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        borderWidth: kind === "ghost" ? 1.5 : 0, borderColor: c.primary, opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
      }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={{ fontFamily: FONTS.displayMid, fontSize: small ? 13.5 : 15.5, color: fg }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999,
        backgroundColor: active ? c.heading : c.surface }}>
      {icon ? <Ionicons name={icon} size={15} color={active ? c.bg : c.heading} /> : null}
      <Text style={{ fontFamily: FONTS.displayMid, fontSize: 13.5, color: active ? c.bg : c.heading }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 18 }}>{children}</ScrollView>;
}

/* ---------- Brand bits ---------- */
// The plate P. mirrored puts the plate left of the bar, so it reads as the Bangla letter প.
export function PlateMark({ size = 28, stem, plate, ring, mirrored }) {
  const c = useTheme();
  return (
    <Svg width={size * 58 / 72} height={size} viewBox="0 0 58 72">
      <Rect x={mirrored ? 43 : 0} y="0" width="15" height="72" rx="4" fill={stem || c.heading} />
      <Circle cx={mirrored ? 25 : 33} cy="25" r="25" fill={plate || PALETTE.ketchup} />
      <Circle cx={mirrored ? 25 : 33} cy="25" r="14.5" fill="none" stroke={ring || PALETTE.coral} strokeWidth="3.6" />
    </Svg>
  );
}

// "Palate" in English, "প্যালেট" in Bangla, with the plate mark standing in for the first letter.
export function Wordmark({ size = 30, lang: forced }) {
  const c = useTheme();
  const { lang } = useLang();
  if ((forced || lang) === "bn") {
    const s = size * 1.05;
    return (
      <View accessibilityLabel="প্যালেট" accessibilityRole="header">
        <Text style={{ fontFamily: FONTS.bangla, fontSize: s, color: c.heading, includeFontPadding: false }}>
          <Text style={{ color: "transparent" }}>প</Text>্যালেট
        </Text>
        <View style={{ position: "absolute", left: s * 0.01, top: s * 0.366 }} pointerEvents="none">
          <PlateMark size={s * 0.75} mirrored />
        </View>
      </View>
    );
  }
  return (
    <Row gap={1} style={{ alignItems: "flex-end" }} accessibilityLabel="Palate">
      <PlateMark size={size * 0.74} />
      <Text style={{ fontFamily: FONTS.display, fontSize: size, lineHeight: size * 1.05, color: c.heading, letterSpacing: -1 }}>alate</Text>
    </Row>
  );
}

export function Plates({ n, size = 14 }) {
  const c = useTheme();
  return (
    <Row gap={3}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: size, borderWidth: 2, borderColor: c.primary, backgroundColor: i <= n ? c.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
          {i <= n ? <View style={{ width: size * 0.38, height: size * 0.38, borderRadius: size, backgroundColor: c.coral }} /> : null}
        </View>
      ))}
    </Row>
  );
}

export function ScoreBadge({ score, size = "md" }) {
  const c = useTheme();
  const { score: fmt } = useFormat();
  const col = scoreColors(c, score == null ? null : Number(score));
  const big = size === "lg";
  return (
    <View style={{ backgroundColor: col.bg, borderRadius: big ? 18 : 12, minWidth: big ? 64 : 46, height: big ? 56 : 34, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: FONTS.display, fontSize: big ? 26 : 16, color: col.fg }}>{fmt(score)}</Text>
    </View>
  );
}

const AVATAR_COLORS = [PALETTE.ketchup, PALETTE.sauce, PALETTE.aubergine, "#B5476A", "#9A3B12"];
export function Avatar({ name = "?", url, size = 40 }) {
  const color = AVATAR_COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: FONTS.display, color: PALETTE.bright, fontSize: size * 0.42 }}>{name.trim()[0]?.toUpperCase() || "?"}</Text>
    </View>
  );
}

export function Badge({ label, tone = "primary", icon }) {
  const c = useTheme();
  const map = { primary: [c.primary, c.onPrimary], soft: [c.primarySoft, c.primary], accent: [c.accentSoft, c.accent], good: [c.dark ? "#123B25" : "#DDF3E6", c.good], dark: [c.heading, c.bg] };
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
      {icon ? <Ionicons name={icon} size={11} color={fg} /> : null}
      <Text style={{ fontFamily: FONTS.displayMid, fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase", color: fg }}>{label}</Text>
    </View>
  );
}

export function RoleBadges({ role, club }) {
  const { t } = useLang();
  return (
    <Row gap={5}>
      {role === "critic" ? <Badge label={t("critic")} icon="ribbon" /> : null}
      {role === "admin" ? <Badge label={t("admin")} tone="dark" icon="shield-checkmark" /> : null}
      {club ? <Badge label={t("club")} tone="accent" icon="star" /> : null}
    </Row>
  );
}

export function LangToggle() {
  const c = useTheme();
  const { lang, setLang } = useLang();
  return (
    <Row gap={0} style={{ backgroundColor: c.surface, borderRadius: 999, padding: 3 }}>
      {[["en", "EN"], ["bn", "বাং"]].map(([k, label]) => (
        <Pressable key={k} onPress={() => setLang(k)} accessibilityRole="button" accessibilityState={{ selected: lang === k }}
          style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: lang === k ? c.primary : "transparent" }}>
          <Text style={{ fontFamily: FONTS.displayMid, fontSize: 13, color: lang === k ? c.onPrimary : c.muted }}>{label}</Text>
        </Pressable>
      ))}
    </Row>
  );
}

/* ---------- States ---------- */
export function Loading() {
  const c = useTheme();
  return <View style={{ paddingVertical: 60, alignItems: "center" }}><ActivityIndicator color={c.primary} size="large" /></View>;
}

export function ErrorState({ onRetry }) {
  const { t } = useLang();
  return (
    <View style={{ paddingVertical: 40, alignItems: "center", gap: 14 }}>
      <T muted style={{ textAlign: "center" }}>{t("errorLoad")}</T>
      {onRetry ? <Button kind="ghost" small title={t("retry")} onPress={onRetry} /> : null}
    </View>
  );
}

export function Empty({ text, action }) {
  return (
    <View style={{ paddingVertical: 36, alignItems: "center", gap: 14 }}>
      <T muted style={{ textAlign: "center", maxWidth: 300 }}>{text}</T>
      {action}
    </View>
  );
}

export function SectionTitle({ title, sub, action }) {
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="h2">{title}</T>
        {sub ? <T v="small" muted>{sub}</T> : null}
      </View>
      {action}
    </Row>
  );
}

/* ---------- Lists ---------- */
export function RestaurantRow({ r, rank, right }) {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  return (
    <Pressable onPress={() => router.push(`/restaurant/${r.id || r.restaurant_id}`)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}>
      {rank != null ? <T v="h2" color={c.primary} style={{ width: 26, textAlign: "center" }}>{f.num(rank)}</T> : null}
      <Image source={r.cover_url ? { uri: r.cover_url } : null} style={{ width: 62, height: 62, borderRadius: 16, backgroundColor: c.surfaceAlt }} contentFit="cover" transition={150} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="h3" numberOfLines={1}>{r.name || r.restaurant_name}</T>
        <T v="small" muted numberOfLines={1}>{[f.cuisine(r), f.area(r.area)].filter(Boolean).join(" · ")}</T>
        <Row gap={6}>
          {r.plates > 0 ? <Plates n={r.plates} size={11} /> : null}
          {r.taka_pick ? <Badge label={t("takaPick")} tone="accent" /> : null}
          {r.avg_cost ? <T v="small" muted>{f.taka(r.avg_cost)}</T> : null}
        </Row>
      </View>
      {right !== undefined ? right : <ScoreBadge score={r.score} />}
    </Pressable>
  );
}

export function ReviewCard({ r, me, onToggleLike, onToggleHelpful, onReport, hideRestaurant }) {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const name = me && r.user_id === me ? t("you") : r.display_name;
  return (
    <Card>
      <Pressable onPress={() => router.push(`/user/${r.user_id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14 }}>
        <Avatar name={r.display_name} url={r.avatar_url} size={40} />
        <View style={{ flex: 1, gap: 3 }}>
          <Row gap={6}><T v="bodyBold" numberOfLines={1} style={{ flexShrink: 1 }}>{name}</T><RoleBadges role={r.role} club={r.club} /></Row>
          <T v="small" muted>@{r.username} · {f.ago(r.created_at)}</T>
        </View>
      </Pressable>
      {r.photo_urls?.length ? (
        <Pressable onPress={() => router.push(`/restaurant/${r.restaurant_id}`)}>
          <Image source={{ uri: r.photo_urls[0] }} style={{ width: "100%", aspectRatio: 4 / 3, backgroundColor: c.surfaceAlt }} contentFit="cover" transition={200} />
        </Pressable>
      ) : null}
      <View style={{ padding: 14, gap: 8 }}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Pressable style={{ flex: 1, gap: 2 }} onPress={() => !hideRestaurant && router.push(`/restaurant/${r.restaurant_id}`)}>
            {!hideRestaurant ? <T v="h2" numberOfLines={2}>{r.restaurant_name}</T> : null}
            <T v="small" muted>{[r.dish_name, !hideRestaurant && f.area(r.area), r.spent && f.taka(r.spent) + " " + t("perPerson")].filter(Boolean).join(" · ")}</T>
          </Pressable>
          <ScoreBadge score={r.score} />
        </Row>
        {r.verified ? <Badge label={t("verifiedVisit")} tone="good" icon="checkmark-circle" /> : null}
        {r.body ? <T>{r.body}</T> : null}
      </View>
      <Row gap={18} style={{ borderTopWidth: 1, borderTopColor: c.line, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Pressable onPress={onToggleLike} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 5 }} accessibilityLabel={t("likes")}>
          <Ionicons name={r.liked ? "heart" : "heart-outline"} size={19} color={r.liked ? c.primary : c.muted} />
          <T v="small" muted>{f.num(r.like_count || 0)}</T>
        </Pressable>
        <Pressable onPress={onToggleHelpful} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 5 }} accessibilityLabel={t("helpful")}>
          <Ionicons name={r.markedHelpful ? "thumbs-up" : "thumbs-up-outline"} size={18} color={r.markedHelpful ? c.accent : c.muted} />
          <T v="small" muted>{t("helpful")} {f.num(r.helpful_count || 0)}</T>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onReport} hitSlop={8} accessibilityLabel={t("report")}>
          <Ionicons name="flag-outline" size={17} color={c.muted} />
        </Pressable>
      </Row>
    </Card>
  );
}

export const styles = StyleSheet.create({
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: FONTS.body },
});
