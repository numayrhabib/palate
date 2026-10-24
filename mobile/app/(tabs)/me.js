import { router } from "expo-router";
import { ProfileBody } from "../../lib/profile";
import { Button, Empty, LangToggle, Loading, Screen, T, Wordmark } from "../../lib/ui";
import { useAuth } from "../../lib/auth";
import { useLang } from "../../lib/i18n";
import { View } from "react-native";

export default function Me() {
  const { t } = useLang();
  const { ready, user } = useAuth();
  if (!ready) return <Screen><Loading /></Screen>;
  if (!user) {
    return (
      <Screen>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark size={30} />
          <LangToggle />
        </View>
        <T v="display">{t("signInTitle")}</T>
        <Empty text={t("signInSub")} action={<Button title={t("goSignIn")} onPress={() => router.push("/sign-in")} />} />
      </Screen>
    );
  }
  return <ProfileBody id={user.id} isMe />;
}
