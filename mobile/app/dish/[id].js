import { View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { BackBar, Empty, ErrorState, Loading, RestaurantRow, Screen, T, useAsync } from "../../lib/ui";
import { useFormat, useLang } from "../../lib/i18n";
import { useTheme } from "../../lib/theme";
import { getDishRankings, getDishes } from "../../lib/api";

export default function DishScreen() {
  const { id } = useLocalSearchParams();
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const dish = useAsync(async () => (await getDishes()).find((d) => d.id === id), [id]);
  const ranks = useAsync(() => getDishRankings(id), [id]);
  const name = dish.data ? f.dishName(dish.data) : "";

  return (
    <Screen header={<BackBar title={name} />} onRefresh={ranks.reload}>
      {dish.data?.photo_url ? <Image source={{ uri: dish.data.photo_url }} style={{ width: "100%", height: 190, borderRadius: 24, backgroundColor: c.surfaceAlt }} contentFit="cover" /> : null}
      <View style={{ gap: 4 }}>
        <T v="eyebrow" color={c.primary}>{t("dishOfTheCity")}</T>
        <T v="display">{t("bestOf")} {name}</T>
      </View>
      {ranks.loading ? <Loading /> : ranks.error ? <ErrorState onRetry={ranks.reload} /> : !ranks.data.length ? <Empty text={t("noneYet")} /> : (
        <View>
          {ranks.data.map((r) => (
            <RestaurantRow key={r.restaurant_id} rank={r.position} r={{ ...r, id: r.restaurant_id, name: r.restaurant_name }} />
          ))}
        </View>
      )}
    </Screen>
  );
}
