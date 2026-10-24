import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { HindSiliguri_400Regular, HindSiliguri_600SemiBold, HindSiliguri_700Bold } from "@expo-google-fonts/hind-siliguri";
import { AuthProvider } from "../lib/auth";
import { LangProvider } from "../lib/i18n";
import { useTheme } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold, HindSiliguri_400Regular, HindSiliguri_600SemiBold, HindSiliguri_700Bold,
  });
  const c = useTheme();
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync().catch(() => {}); }, [loaded, error]);
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <SafeAreaProvider>
      <LangProvider>
        <AuthProvider>
          <StatusBar style={c.dark ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: "slide_from_right" }} />
        </AuthProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}
