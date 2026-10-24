import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Badge, Button, Empty, ErrorState, Ionicons, Loading, Plates, ReviewCard, Row, ScoreBadge, Screen, T, useAsync } from "../../lib/ui";
import { useAuth } from "../../lib/auth";
import { useFormat, useLang } from "../../lib/i18n";
import { FONTS, useTheme } from "../../lib/theme";
import { getFeed, getRestaurant, isSaved, toggle } from "../../lib/api";
import { notify, useReviewActions } from "../../lib/actions";

function Fact({ value, label }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 10, gap: 2, alignItems: "center" }}>
      <T v="h2">{value}</T>
      <T v="small" muted style={{ textAlign: "center" }}>{label}</T>
    </View>
  );
}

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const { user } = useAuth();
  const r = useAsync(() => getRestaurant(id), [id]);
  const reviews = useAsync(() => getFeed({ restaurantId: id, userId: user?.id }), [id, user?.id]);
  const saved = useAsync(() => (user ? isSaved(user.id, id) : Promise.resolve(false)), [user?.id, id]);
  const act = useReviewActions(reviews.setData);
  const [criticsOnly, setCriticsOnly] = useState(false);

  const toggleSave = async () => {
    if (!user) return router.push("/sign-in");
    const on = !saved.data;
    saved.setData(on);
    try { await toggle("saves", { user_id: user.id, restaurant_id: id }, on); } catch { saved.setData(!on); notify(t("errorLoad")); }
  };

  if (r.loading) return <Screen><Loading /></Screen>;
  if (r.error) return <Screen><ErrorState onRetry={r.reload} /></Screen>;
  const x = r.data;
  const list = (reviews.data || []).filter((v) => !criticsOnly || v.role === "critic" || v.role === "admin");

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen padded={false} onRefresh={() => Promise.all([r.reload(), reviews.reload()])}>
        <View>
          <Image source={x.cover_url ? { uri: x.cover_url } : null} style={{ width: "100%", height: 280, backgroundColor: c.surfaceAlt }} contentFit="cover" />
          <View style={{ position: "absolute", top: 8, left: 14, right: 14, flexDirection: "row", justifyContent: "space-between" }}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} accessibilityLabel={t("back")} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="chevron-back" size={22} color={c.heading} />
            </Pressable>
            <Pressable onPress={toggleSave} accessibilityLabel={saved.data ? t("saved") : t("save")} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={saved.data ? "bookmark" : "bookmark-outline"} size={20} color={c.primary} />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, gap: 16 }}>
          <View style={{ gap: 6 }}>
            <T v="eyebrow" muted>{[f.cuisine(x), f.area(x.area)].filter(Boolean).join(" · ")}</T>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <T v="display" style={{ flex: 1 }}>{x.name}</T>
              <ScoreBadge score={x.score} size="lg" />
            </Row>
            <Row gap={8} wrap>
              {x.plates > 0 ? (
                <Row gap={6} style={{ backgroundColor: c.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Plates n={x.plates} size={12} />
                  <Text style={{ fontFamily: FONTS.displayMid, fontSize: 12, color: c.primary }}>{t("guideKicker")}</Text>
                </Row>
              ) : null}
              {x.taka_pick ? <Badge label={t("takaPick")} tone="accent" icon="cash" /> : null}
              {x.verified_count > 0 ? <Badge label={`${f.num(x.verified_count)} ${t("verifiedVisit")}`} tone="good" icon="checkmark-circle" /> : null}
            </Row>
          </View>

          <Row gap={8}>
            <Fact value={f.score(x.critic_score)} label={t("criticScore")} />
            <Fact value={x.cleanliness ? f.num(Number(x.cleanliness).toFixed(1)) + "/5" : "–"} label={t("cleanliness")} />
            <Fact value={f.taka(x.avg_spent || x.avg_cost)} label={t("perPerson")} />
            <Fact value={x.google_rating ? f.num(Number(x.google_rating).toFixed(1)) : "–"} label={t("googleRating")} />
          </Row>
          <T v="small" muted>{t("criticsFirst")} {f.num(x.review_count)} {t("reviewsN")}.</T>

          <Button icon="create" title={t("writeReview")} onPress={() => router.push({ pathname: "/review", params: { restaurant: x.id } })} />

          <Row style={{ justifyContent: "space-between" }}>
            <T v="h2">{t("whatPeopleSay")}</T>
            <Pressable onPress={() => setCriticsOnly((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: criticsOnly }}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: criticsOnly ? c.primary : c.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="ribbon" size={14} color={criticsOnly ? c.onPrimary : c.primary} />
              <Text style={{ fontFamily: FONTS.displayMid, fontSize: 12.5, color: criticsOnly ? c.onPrimary : c.primary }}>{t("critic")}</Text>
            </Pressable>
          </Row>
          {reviews.loading ? <Loading /> : reviews.error ? <ErrorState onRetry={reviews.reload} /> : !list.length ? <Empty text={t("noneYet")} /> :
            list.map((v) => <ReviewCard key={v.id} r={v} me={user?.id} hideRestaurant onToggleLike={() => act.like(v)} onToggleHelpful={() => act.helpful(v)} onReport={() => act.report(v)} />)}
        </View>
      </Screen>
    </View>
  );
}
