import { useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { BackBar, Empty, Button, Chip, Row, Screen, T, styles } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { AREAS, useFormat, useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { addRestaurant } from "../lib/api";
import { notify } from "../lib/actions";

export default function NewPlace() {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const { user } = useAuth();
  const [v, setV] = useState({ name: "", area: "dhanmondi", cuisine_en: "", price_level: 2, avg_cost: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (p) => setV((x) => ({ ...x, ...p }));

  if (!user) return <Screen header={<BackBar title="" />}><Empty text={t("needSignIn")} action={<Button title={t("goSignIn")} onPress={() => router.push("/sign-in")} />} /></Screen>;

  const save = async () => {
    if (!v.name.trim()) { setError(t("name") + " — " + t("required")); return; }
    setBusy(true); setError("");
    try {
      const r = await addRestaurant(user.id, { name: v.name.trim(), area: v.area, cuisine_en: v.cuisine_en.trim() || null, price_level: v.price_level, avg_cost: v.avg_cost ? Number(v.avg_cost) : null });
      notify(t("placeAdded"));
      router.replace({ pathname: "/review", params: { restaurant: r.id } });
    } catch (e) { setError(e.message || t("errorLoad")); } finally { setBusy(false); }
  };

  const input = [styles.input, { backgroundColor: c.surface, color: c.ink }];
  return (
    <Screen header={<BackBar title="" />}>
      <T v="display">{t("newPlaceTitle")}</T>
      <View style={{ gap: 8 }}>
        <T v="h3">{t("name")}</T>
        <TextInput value={v.name} onChangeText={(x) => set({ name: x })} maxLength={80} style={input} accessibilityLabel={t("name")} />
      </View>
      <View style={{ gap: 8 }}>
        <T v="h3">{t("area")}</T>
        <Row gap={8} wrap>{Object.keys(AREAS).map((k) => <Chip key={k} label={f.area(k)} active={v.area === k} onPress={() => set({ area: k })} />)}</Row>
      </View>
      <View style={{ gap: 8 }}>
        <T v="h3">{t("cuisine")}</T>
        <TextInput value={v.cuisine_en} onChangeText={(x) => set({ cuisine_en: x })} maxLength={60} placeholder={t("cuisinePh")} placeholderTextColor={c.muted} style={input} />
      </View>
      <View style={{ gap: 8 }}>
        <T v="h3">{t("priceLevel")}</T>
        <Row gap={8}>{[1, 2, 3, 4].map((p) => <Chip key={p} label={"৳".repeat(p)} active={v.price_level === p} onPress={() => set({ price_level: p })} />)}</Row>
      </View>
      <View style={{ gap: 8 }}>
        <T v="h3">{t("avgCost")}</T>
        <TextInput value={v.avg_cost} onChangeText={(x) => set({ avg_cost: x.replace(/[^0-9]/g, "") })} keyboardType="number-pad" placeholder="600" placeholderTextColor={c.muted} style={[...input, { width: 160 }]} />
      </View>
      {error ? <T color={c.danger}>{error}</T> : null}
      <Button title={t("addPlaceBtn")} loading={busy} onPress={save} />
    </Screen>
  );
}
