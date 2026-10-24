import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Avatar, BackBar, Button, Chip, Empty, ErrorState, Ionicons, LangToggle, Loading, RestaurantRow, ReviewCard, RoleBadges, Row, Screen, ScoreBadge, T, Wordmark, useAsync } from "./ui";
import { useAuth } from "./auth";
import { useFormat, useLang } from "./i18n";
import { useTheme } from "./theme";
import { getFeed, getProfile, getRankings, getSaved, isFollowing, toggle } from "./api";
import { notify, useReviewActions } from "./actions";
import { CRITIC_REQUIREMENTS } from "./config";

function LinkCard({ icon, color, title, sub, onPress }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.surface, borderRadius: 20, padding: 14, opacity: pressed ? 0.8 : 1 })}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="h3">{title}</T>
        <T v="small" muted>{sub}</T>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

export function ProfileBody({ id, isMe }) {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const { user, signOut, profile: myProfile } = useAuth();
  const [tab, setTab] = useState("rankings");
  const prof = useAsync(() => getProfile(id), [id]);
  const ranks = useAsync(() => getRankings(id), [id]);
  const reviews = useAsync(() => getFeed({ authorId: id, userId: user?.id }), [id, user?.id]);
  const saved = useAsync(() => (isMe ? getSaved(id) : Promise.resolve([])), [id, isMe]);
  const follow = useAsync(() => (user && !isMe ? isFollowing(user.id, id) : Promise.resolve(false)), [user?.id, id]);
  const act = useReviewActions(reviews.setData);

  const toggleFollow = async () => {
    if (!user) return router.push("/sign-in");
    const on = !follow.data;
    follow.setData(on);
    prof.setData((p) => ({ ...p, followers: Number(p.followers) + (on ? 1 : -1) }));
    try { await toggle("follows", { follower_id: user.id, following_id: id }, on); }
    catch { follow.setData(!on); notify(t("errorLoad")); }
  };

  const header = isMe ? (
    <Row style={{ justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 6 }}>
      <Wordmark size={28} />
      <LangToggle />
    </Row>
  ) : <BackBar title={prof.data?.display_name || ""} />;

  if (prof.loading) return <Screen header={header}><Loading /></Screen>;
  if (prof.error) return <Screen header={header}><ErrorState onRetry={prof.reload} /></Screen>;
  const p = prof.data;
  const all = ranks.data ? [...ranks.data.loved, ...ranks.data.fine, ...ranks.data.bad] : [];
  const req = CRITIC_REQUIREMENTS;
  const progress = Math.min(1, (Math.min(p.review_count / req.reviews, 1) + Math.min(p.photo_review_count / req.photoReviews, 1) +
    Math.min(p.verified_count / req.verified, 1) + Math.min(p.helpful_received / req.helpful, 1)) / 4);

  return (
    <Screen header={header} onRefresh={() => Promise.all([prof.reload(), ranks.reload(), reviews.reload()])}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <Avatar name={p.display_name} url={p.avatar_url} size={92} />
        <T v="h1" style={{ textAlign: "center" }}>{p.display_name}</T>
        <T muted>@{p.username}</T>
        <RoleBadges role={p.role} club={p.club} />
        {p.bio ? <T style={{ textAlign: "center", maxWidth: 320 }}>{p.bio}</T> : null}
      </View>

      <Row gap={10}>
        {[[p.review_count, t("reviewsN")], [p.followers, t("followers")], [p.following, t("followingN")]].map(([n, label]) => (
          <View key={label} style={{ flex: 1, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 12, alignItems: "center" }}>
            <T v="h1">{f.num(n)}</T>
            <T v="small" muted>{label}</T>
          </View>
        ))}
      </Row>

      {!isMe ? <Button kind={follow.data ? "ghost" : "primary"} icon={follow.data ? "checkmark" : "person-add"} title={follow.data ? t("unfollow") : t("follow")} onPress={toggleFollow} /> : null}

      {isMe ? (
        <View style={{ gap: 10 }}>
          <LinkCard icon="star" color={c.accent} title={t("clubTitle")} sub={p.club ? t("clubActive") + " " + new Date(myProfile?.club_until || Date.now()).toLocaleDateString() : t("clubSub")} onPress={() => router.push("/club")} />
          {p.role === "member" ? (
            <LinkCard icon="ribbon" color={c.primary} title={t("criticTitle")} sub={`${f.num(Math.round(progress * 100))}% ${t("progress")}`} onPress={() => router.push("/critic")} />
          ) : null}
          <LinkCard icon="people" color={c.heading} title={t("tasteTwins")} sub={t("tasteTwinsSub")} onPress={() => router.push("/twins")} />
        </View>
      ) : null}

      <Row gap={8}>
        <Chip label={isMe ? t("rankings") : t("whereTheyGo")} active={tab === "rankings"} onPress={() => setTab("rankings")} />
        <Chip label={t("reviewsTab")} active={tab === "reviews"} onPress={() => setTab("reviews")} />
        {isMe ? <Chip label={t("savedTab")} active={tab === "saved"} onPress={() => setTab("saved")} /> : null}
      </Row>

      {tab === "rankings" ? (
        ranks.loading ? <Loading /> : ranks.error ? <ErrorState onRetry={ranks.reload} /> : !all.length ? <Empty text={t("noneYet")} /> :
          <View>{all.map((r, i) => <RestaurantRow key={r.id} r={r} rank={i + 1} right={<ScoreBadge score={r.score} />} />)}</View>
      ) : null}
      {tab === "reviews" ? (
        reviews.loading ? <Loading /> : reviews.error ? <ErrorState onRetry={reviews.reload} /> : !reviews.data.length ? <Empty text={t("noneYet")} /> :
          reviews.data.map((r) => <ReviewCard key={r.id} r={r} me={user?.id} onToggleLike={() => act.like(r)} onToggleHelpful={() => act.helpful(r)} onReport={() => act.report(r)} />)
      ) : null}
      {tab === "saved" ? (
        saved.loading ? <Loading /> : !saved.data?.length ? <Empty text={t("noneYet")} /> :
          <View>{saved.data.map((r) => <RestaurantRow key={r.id} r={r} right={null} />)}</View>
      ) : null}

      {isMe ? <Button kind="ghost" icon="log-out-outline" title={t("signOut")} onPress={signOut} /> : null}
    </Screen>
  );
}
