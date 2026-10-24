import { Pressable, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FONTS, useTheme } from "../../lib/theme";
import { useLang } from "../../lib/i18n";

const ICONS = { index: "flame", explore: "compass", review: "add", guide: "ribbon", me: "person" };
const LABELS = { index: "feed", explore: "explore", review: "review", guide: "guide", me: "me" };

function TabBar({ state, navigation }) {
  const c = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: "row", backgroundColor: c.tabBar, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8, borderTopWidth: 1, borderTopColor: c.line }}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const isAdd = route.name === "review";
        const color = focused ? c.primary : c.muted;
        return (
          <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={t(LABELS[route.name])}
            onPress={() => { const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true }); if (!focused && !e.defaultPrevented) navigation.navigate(route.name); }}
            style={{ flex: 1, alignItems: "center", gap: 3 }}>
            {isAdd ? (
              <View style={{ width: 52, height: 52, marginTop: -22, borderRadius: 26, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: c.tabBar }}>
                <Ionicons name="add" size={28} color={c.onPrimary} />
              </View>
            ) : (
              <Ionicons name={focused ? ICONS[route.name] : ICONS[route.name] + "-outline"} size={23} color={color} />
            )}
            <Text style={{ fontFamily: focused ? FONTS.displayMid : FONTS.body, fontSize: 11.5, color }}>{t(LABELS[route.name])}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="review" />
      <Tabs.Screen name="guide" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
