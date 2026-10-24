import { useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { BackBar, Button, Screen, T, Wordmark, styles } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export default function SignIn() {
  const c = useTheme();
  const { t } = useLang();
  const { sendCode, verifyCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError(t("email") + " — " + t("required")); return; }
    setBusy(true); setError("");
    try { await sendCode(email.trim().toLowerCase()); setSent(true); }
    catch (e) { setError(e.message || t("errorLoad")); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setError("");
    try { await verifyCode(email.trim().toLowerCase(), code.trim()); router.canGoBack() ? router.back() : router.replace("/me"); }
    catch (e) { setError(e.message || t("errorLoad")); }
    finally { setBusy(false); }
  };

  return (
    <Screen header={<BackBar title="" />}>
      <View style={{ alignItems: "flex-start", gap: 14, paddingTop: 10 }}>
        <Wordmark size={40} />
        <T v="display">{t("signInTitle")}</T>
        <T muted>{t("signInSub")}</T>
      </View>
      {!sent ? (
        <View style={{ gap: 12 }}>
          <T v="h3">{t("email")}</T>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address"
            placeholder="you@example.com" placeholderTextColor={c.muted} style={[styles.input, { backgroundColor: c.surface, color: c.ink }]} accessibilityLabel={t("email")} />
          {error ? <T color={c.danger}>{error}</T> : null}
          <Button title={t("sendCode")} onPress={send} loading={busy} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <T>{t("codeSent")} <T v="bodyBold">{email}</T></T>
          <T v="h3">{t("code")}</T>
          <TextInput value={code} onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={8} autoComplete="one-time-code"
            placeholder="123456" placeholderTextColor={c.muted} style={[styles.input, { backgroundColor: c.surface, color: c.ink, fontSize: 24, letterSpacing: 6 }]} accessibilityLabel={t("code")} />
          {error ? <T color={c.danger}>{error}</T> : null}
          <Button title={t("verify")} onPress={verify} loading={busy} disabled={code.length < 6} />
          <Button kind="ghost" title={t("changeEmail")} onPress={() => { setSent(false); setCode(""); }} />
        </View>
      )}
    </Screen>
  );
}
