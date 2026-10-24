import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Avatar, BackBar, Button, Empty, ErrorState, Loading, RoleBadges, Row, Screen, T, useAsync } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { useFormat, useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { getTasteTwins } from "../lib/api";

export default function Twins() {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const { user } = useAuth();
  const twins = useAsync(() => (user ? getTasteTwins() : Promise.resolve([])), [user?.id]);

  return (
    <Screen header={<BackBar title="" />} onRefresh={twins.reload}>
      <View style={{ gap: 6 }}>
        <T v="display">{t("tasteTwins")}</T>
        <T muted>{t("tasteTwinsSub")}</T>
      </View>
      {twins.loading ? <Loading /> : twins.error ? <ErrorState onRetry={twins.reload} /> : !twins.data.length ? (
        <Empty text={t("twinsEmpty")} action={<Button title={t("writeReview")} onPress={() => router.push("/review")} />} />
      ) : twins.data.map((p) => (
        <Pressable key={p.user_id} onPress={() => router.push(`/user/${p.user_id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surface, borderRadius: 20, padding: 12 }}>
          <Avatar name={p.display_name} url={p.avatar_url} size={50} />
          <View style={{ flex: 1, gap: 3 }}>
            <Row gap={6}><T v="h3">{p.display_name}</T><RoleBadges role={p.role} /></Row>
            <T v="small" muted>{f.num(p.common)} {t("inCommon")}</T>
          </View>
          <View style={{ alignItems: "center" }}>
            <T v="h1" color={c.primary}>{f.num(p.match)}%</T>
            <T v="small" muted>{t("match")}</T>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
