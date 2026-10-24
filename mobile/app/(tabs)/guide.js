import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Chip, ErrorState, Empty, Loading, Plates, RestaurantRow, Row, Screen, T, useAsync } from "../../lib/ui";
import { useFormat, useLang } from "../../lib/i18n";
import { FONTS, useTheme } from "../../lib/theme";
import { getDishRankings, getRestaurants } from "../../lib/api";
import { Pressable, Text } from "react-native";

export default function Guide() {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const [tab, setTab] = useState("plates");
  const plated = useAsync(() => getRestaurants({ plated: true }), []);
  const taka = useAsync(() => getRestaurants({ takaPick: true }), []);
  const best = useAsync(() => getDishRankings(), []);
  const winners = (best.data || []).filter((d) => d.position === 1);

  return (
    <Screen onRefresh={() => Promise.all([plated.reload(), taka.reload(), best.reload()])}>
      <View style={{ backgroundColor: c.primary, borderRadius: 28, padding: 22, gap: 8 }}>
        <Text style={{ fontFamily: FONTS.displayMid, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: c.coral }}>{t("guideKicker")}</Text>
        <Text style={{ fontFamily: FONTS.display, fontSize: 42, lineHeight: 44, color: c.onPrimary, letterSpacing: -1 }}>{t("guideTitle")}</Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: c.onPrimary, opacity: 0.92 }}>{t("guideSub")}</Text>
      </View>

      <Row gap={8}>
        <Chip label={t("platesTab")} icon="ellipse" active={tab === "plates"} onPress={() => setTab("plates")} />
        <Chip label={t("takaPick")} icon="cash" active={tab === "taka"} onPress={() => setTab("taka")} />
        <Chip label={t("dishOfTheCity")} icon="trophy" active={tab === "dish"} onPress={() => setTab("dish")} />
      </Row>

      {tab === "plates" ? (
        plated.loading ? <Loading /> : plated.error ? <ErrorState onRetry={plated.reload} /> : (
          [3, 2, 1].map((n) => {
            const list = plated.data.filter((r) => r.plates === n);
            if (!list.length) return null;
            return (
              <View key={n} style={{ gap: 4 }}>
                <Row gap={10} style={{ paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: c.line }}>
                  <Plates n={n} size={16} />
                  <View style={{ flex: 1 }}>
                    <T v="h2">{t("plates" + n)}</T>
                    <T v="small" muted>{t("plates" + n + "d")}</T>
                  </View>
                </Row>
                {list.map((r) => <RestaurantRow key={r.id} r={r} />)}
              </View>
            );
          })
        )
      ) : null}

      {tab === "taka" ? (
        <View style={{ gap: 6 }}>
          <View style={{ backgroundColor: c.accentSoft, borderRadius: 20, padding: 16, gap: 4 }}>
            <T v="h2" color={c.accent}>{t("takaPick")}</T>
            <T v="small">{t("takaPickSub")}</T>
          </View>
          {taka.loading ? <Loading /> : taka.error ? <ErrorState onRetry={taka.reload} /> : !taka.data.length ? <Empty text={t("noneYet")} /> :
            taka.data.map((r) => <RestaurantRow key={r.id} r={r} />)}
        </View>
      ) : null}

      {tab === "dish" ? (
        best.loading ? <Loading /> : best.error ? <ErrorState onRetry={best.reload} /> : !winners.length ? <Empty text={t("noneYet")} /> : (
          <View style={{ gap: 12 }}>
            {winners.map((w) => (
              <Pressable key={w.dish_id} onPress={() => router.push(`/dish/${w.dish_id}`)} style={{ flexDirection: "row", gap: 12, backgroundColor: c.surface, borderRadius: 20, padding: 10, alignItems: "center" }}>
                <Image source={w.photo_url ? { uri: w.photo_url } : null} style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: c.surfaceAlt }} contentFit="cover" />
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="eyebrow" color={c.primary}>{t("bestOf")} {f.dishName(w)}</T>
                  <T v="h3" numberOfLines={1}>{w.restaurant_name}</T>
                  <T v="small" muted>{f.area(w.area)} · {f.num(w.review_count)} {t("reviewsN")}</T>
                </View>
                <T v="h2" color={c.primary}>{f.score(w.score)}</T>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 18, gap: 12 }}>
        <T v="h2">{t("howItWorks")}</T>
        {["hw1", "hw2", "hw3"].map((k, i) => (
          <Row key={k} gap={12} style={{ alignItems: "flex-start" }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <T v="h3" color={c.primary}>{f.num(i + 1)}</T>
            </View>
            <T style={{ flex: 1 }}>{t(k)}</T>
          </Row>
        ))}
      </View>
    </Screen>
  );
}
