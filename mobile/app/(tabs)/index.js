import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Avatar, Button, Chip, Empty, ErrorState, LangToggle, Loading, ReviewCard, Row, Screen, T, Wordmark, useAsync } from "../../lib/ui";
import { useAuth } from "../../lib/auth";
import { useFormat, useLang } from "../../lib/i18n";
import { FONTS, useTheme } from "../../lib/theme";
import { getEpisodes, getFeed, getTopCritics } from "../../lib/api";
import { useReviewActions } from "../../lib/actions";

function Episodes() {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const eps = useAsync(getEpisodes, []);
  if (!eps.data?.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <T v="h2">{t("whereTheyEat")}</T>
        <T v="small" muted>{t("whereTheyEatSub")}</T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 18 }}>
        {eps.data.map((e, i) => (
          <Pressable key={e.id} onPress={() => e.restaurant_id && router.push(`/restaurant/${e.restaurant_id}`)} style={{ width: 250, borderRadius: 22, overflow: "hidden", backgroundColor: c.heading }}>
            <Image source={{ uri: e.thumbnail_url }} style={{ width: "100%", height: 150 }} contentFit="cover" />
            <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: c.primary, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
              <Text style={{ fontFamily: FONTS.displayMid, fontSize: 10.5, color: c.onPrimary, letterSpacing: 0.6 }}>EP {f.num(eps.data.length - i)}</Text>
            </View>
            <View style={{ padding: 12, gap: 4 }}>
              <Text style={{ fontFamily: FONTS.display, fontSize: 16, lineHeight: 20, color: c.bg }} numberOfLines={2}>{e.title}</Text>
              <Text style={{ fontFamily: FONTS.body, fontSize: 12.5, color: c.coral }} numberOfLines={1}>
                {e.guest_name} · {e.guest_role} · {t("favourite")}: {e.favourite_dish}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function CriticsStrip() {
  const { t } = useLang();
  const critics = useAsync(getTopCritics, []);
  if (!critics.data?.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <T v="h2">{t("topCritics")}</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 18 }}>
        {critics.data.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/user/${p.id}`)} style={{ alignItems: "center", gap: 6, width: 78 }}>
            <Avatar name={p.display_name} url={p.avatar_url} size={62} />
            <T v="small" numberOfLines={1} style={{ textAlign: "center" }}>{p.display_name.split(" ")[0]}</T>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function Feed() {
  const { t } = useLang();
  const { user } = useAuth();
  const [mode, setMode] = useState("forYou");
  const feed = useAsync(() => getFeed({ userId: user?.id, following: mode === "following" }), [user?.id, mode]);
  const act = useReviewActions(feed.setData);

  return (
    <Screen onRefresh={feed.reload} header={
      <Row style={{ justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 4 }}>
        <Wordmark size={32} />
        <LangToggle />
      </Row>
    }>
      <Row gap={8}>
        <Chip label={t("forYou")} active={mode === "forYou"} onPress={() => setMode("forYou")} />
        <Chip label={t("following")} active={mode === "following"} onPress={() => (user ? setMode("following") : router.push("/sign-in"))} />
      </Row>
      {mode === "forYou" ? <Episodes /> : null}
      {mode === "following" && feed.data?.length === 0 ? <CriticsStrip /> : null}
      {feed.loading ? <Loading /> : feed.error ? <ErrorState onRetry={feed.reload} /> :
        !feed.data.length ? (
          <Empty text={mode === "following" ? t("emptyFollowing") : t("emptyFeed")}
            action={mode === "following" ? <Button small title={t("explore")} onPress={() => router.push("/explore")} /> : <Button small title={t("writeReview")} onPress={() => router.push("/review")} />} />
        ) : feed.data.map((r) => (
          <ReviewCard key={r.id} r={r} me={user?.id} onToggleLike={() => act.like(r)} onToggleHelpful={() => act.helpful(r)} onReport={() => act.report(r)} />
        ))}
    </Screen>
  );
}
