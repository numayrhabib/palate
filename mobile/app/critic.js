import { useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { BackBar, Empty, Badge, Button, Ionicons, Loading, Row, Screen, T, styles, useAsync } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { useFormat, useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { CRITIC_REQUIREMENTS } from "../lib/config";
import { applyCritic, getMyApplication } from "../lib/api";
import { notify } from "../lib/actions";

function Requirement({ label, have, need }) {
  const c = useTheme();
  const f = useFormat();
  const done = have >= need;
  return (
    <View style={{ gap: 6 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={8}>
          <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={18} color={done ? c.good : c.muted} />
          <T>{label}</T>
        </Row>
        <T v="bodyBold">{f.num(Math.min(have, need))}/{f.num(need)}</T>
      </Row>
      <View style={{ height: 6, backgroundColor: c.line, borderRadius: 3, overflow: "hidden" }}>
        <View style={{ width: `${Math.min(100, (have / need) * 100)}%`, height: "100%", backgroundColor: done ? c.good : c.accent }} />
      </View>
    </View>
  );
}

export default function Critic() {
  const c = useTheme();
  const { t } = useLang();
  const { user, profile, refreshProfile } = useAuth();
  const app = useAsync(() => (user ? getMyApplication(user.id) : Promise.resolve(null)), [user?.id]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return <Screen header={<BackBar title="" />}><Empty text={t("needSignIn")} action={<Button title={t("goSignIn")} onPress={() => router.push("/sign-in")} />} /></Screen>;
  if (!profile || app.loading) return <Screen header={<BackBar title="" />}><Loading /></Screen>;

  const R = CRITIC_REQUIREMENTS;
  const p = profile;
  const ready = p.review_count >= R.reviews && p.photo_review_count >= R.photoReviews && p.verified_count >= R.verified && p.helpful_received >= R.helpful;
  const pending = app.data?.status === "pending";

  const apply = async () => {
    if (text.trim().length < 20) { notify(t("applyPh")); return; }
    setBusy(true);
    try { await applyCritic(user.id, text.trim()); await app.reload(); await refreshProfile(); notify(t("applied")); }
    catch { notify(t("errorLoad")); } finally { setBusy(false); }
  };

  return (
    <Screen header={<BackBar title="" />}>
      <View style={{ gap: 8 }}>
        <Badge label={t("critic")} icon="ribbon" />
        <T v="display">{t("criticTitle")}</T>
        <T muted>{t("criticSub")}</T>
      </View>

      {p.role === "critic" ? <T v="h2" color={c.good}>{t("youAreCritic")}</T> : (
        <>
          <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 18, gap: 16 }}>
            <Requirement label={t("reqReviews")} have={Number(p.review_count)} need={R.reviews} />
            <Requirement label={t("reqPhotos")} have={Number(p.photo_review_count)} need={R.photoReviews} />
            <Requirement label={t("reqVerified")} have={Number(p.verified_count)} need={R.verified} />
            <Requirement label={t("reqHelpful")} have={Number(p.helpful_received)} need={R.helpful} />
          </View>
          {pending ? <T v="h3" color={c.accent}>{t("pending")}</T> : ready ? (
            <View style={{ gap: 10 }}>
              <TextInput value={text} onChangeText={setText} multiline maxLength={800} placeholder={t("applyPh")} placeholderTextColor={c.muted}
                style={[styles.input, { backgroundColor: c.surface, color: c.ink, minHeight: 110, textAlignVertical: "top" }]} />
              <Button icon="send" title={t("applyNow")} loading={busy} onPress={apply} />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <T muted>{t("keepGoing")}</T>
              <Button icon="create" title={t("writeReview")} onPress={() => router.push("/review")} />
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
