import { useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { BackBar, Button, Chip, Row, Screen, T, Wordmark, styles } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export default function SignIn() {
  const c = useTheme();
  const { t } = useLang();
  const { signInPassword, signUpPassword, sendCode, verifyCode } = useAuth();
  const [mode, setMode] = useState("signin"); // signin | signup | code
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const cleanEmail = () => email.trim().toLowerCase();
  const done = () => (router.canGoBack() ? router.back() : router.replace("/me"));
  const run = async (fn) => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError(t("email") + " — " + t("required")); return; }
    setBusy(true); setError(""); setInfo("");
    try { await fn(); } catch (e) { setError(e.message || t("errorLoad")); } finally { setBusy(false); }
  };

  const submit = () => run(async () => {
    if (mode === "signin") { await signInPassword(cleanEmail(), password); done(); }
    else if (mode === "signup") {
      if (password.length < 8) throw new Error(t("passwordShort"));
      const signedIn = await signUpPassword(cleanEmail(), password);
      if (signedIn) done(); else { setInfo(t("confirmEmail")); setMode("signin"); }
    } else if (!sent) { await sendCode(cleanEmail()); setSent(true); }
    else { await verifyCode(cleanEmail(), code.trim()); done(); }
  });

  const input = [styles.input, { backgroundColor: c.surface, color: c.ink }];
  return (
    <Screen header={<BackBar title="" />}>
      <View style={{ alignItems: "flex-start", gap: 14, paddingTop: 6 }}>
        <Wordmark size={40} />
        <T v="display">{mode === "signup" ? t("createAccount") : t("signInTitle")}</T>
        <T muted>{t("signInSub")}</T>
      </View>
      <Row gap={8} wrap>
        <Chip label={t("verify")} active={mode === "signin"} onPress={() => { setMode("signin"); setError(""); }} />
        <Chip label={t("createAccount")} active={mode === "signup"} onPress={() => { setMode("signup"); setError(""); }} />
        <Chip label={t("emailCode")} active={mode === "code"} onPress={() => { setMode("code"); setError(""); setSent(false); }} />
      </Row>
      {info ? <View style={{ backgroundColor: c.surface, borderRadius: 14, padding: 12 }}><T>{info}</T></View> : null}
      <View style={{ gap: 10 }}>
        <T v="h3">{t("email")}</T>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!(mode === "code" && sent)}
          placeholder="you@example.com" placeholderTextColor={c.muted} style={input} accessibilityLabel={t("email")} />
        {mode !== "code" ? (
          <>
            <T v="h3">{t("password")}</T>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={mode === "signup" ? "new-password" : "password"}
              placeholder={mode === "signup" ? t("passwordShort") : ""} placeholderTextColor={c.muted} style={input} accessibilityLabel={t("password")} />
          </>
        ) : sent ? (
          <>
            <T>{t("codeSent")} <T v="bodyBold">{cleanEmail()}</T></T>
            <TextInput value={code} onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={8} autoComplete="one-time-code"
              placeholder="123456" placeholderTextColor={c.muted} style={[...input, { fontSize: 24, letterSpacing: 6 }]} accessibilityLabel={t("code")} />
          </>
        ) : null}
        {error ? <T color={c.danger}>{error}</T> : null}
        <Button loading={busy} onPress={submit}
          title={mode === "signin" ? t("verify") : mode === "signup" ? t("createAccount") : sent ? t("verify") : t("sendCode")} />
        {mode === "code" && sent ? <Button kind="ghost" title={t("changeEmail")} onPress={() => { setSent(false); setCode(""); }} /> : null}
      </View>
    </Screen>
  );
}
