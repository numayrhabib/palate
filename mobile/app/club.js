import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { BackBar, Button, Ionicons, PlateMark, Row, Screen, T } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { FONTS, PALETTE, useTheme } from "../lib/theme";
import { endClubTest, startClubTest } from "../lib/api";
import { notify } from "../lib/actions";

export default function Club() {
  const c = useTheme();
  const { t } = useLang();
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const active = profile?.club;

  const run = async (fn) => {
    if (!user) return router.push("/sign-in");
    setBusy(true);
    try { await fn(); await refreshProfile(); } catch { notify(t("errorLoad")); } finally { setBusy(false); }
  };

  return (
    <Screen header={<BackBar title="" />}>
      <View style={{ backgroundColor: PALETTE.aubergine, borderRadius: 28, padding: 22, gap: 12 }}>
        <Row gap={10}>
          <PlateMark size={34} stem={PALETTE.bright} plate={PALETTE.sauce} ring={PALETTE.aubergine} />
          <Text style={{ fontFamily: FONTS.display, fontSize: 30, color: PALETTE.bright, letterSpacing: -0.6 }}>{t("clubTitle")}</Text>
        </Row>
        <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: PALETTE.coral }}>{t("clubSub")}</Text>
        <View style={{ gap: 10, paddingTop: 4 }}>
          {["clubPerks1", "clubPerks2", "clubPerks3", "clubPerks4"].map((k) => (
            <Row key={k} gap={10} style={{ alignItems: "flex-start" }}>
              <Ionicons name="checkmark-circle" size={20} color={PALETTE.sauce} />
              <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 15, lineHeight: 21, color: PALETTE.bright }}>{t(k)}</Text>
            </Row>
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: 18, padding: 14, flexDirection: "row", gap: 10 }}>
        <Ionicons name="information-circle" size={20} color={c.primary} />
        <T v="small" style={{ flex: 1 }}>{t("clubNote")}</T>
      </View>

      {active ? (
        <View style={{ gap: 10 }}>
          <T v="h3">{t("clubActive")} {new Date(profile.club_until).toLocaleDateString()}</T>
          <Button kind="ghost" title={t("clubEnd")} loading={busy} onPress={() => run(endClubTest)} />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Button kind="accent" icon="star" title={t("clubTest")} loading={busy} onPress={() => run(startClubTest)} />
          <T v="small" muted style={{ textAlign: "center" }}>{t("clubTestNote")}</T>
        </View>
      )}
    </Screen>
  );
}
