import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Avatar, Button, Chip, ChipRow, Empty, ErrorState, Ionicons, Loading, RestaurantRow, RoleBadges, Row, Screen, T, styles, useAsync } from "../../lib/ui";
import { AREAS, useFormat, useLang } from "../../lib/i18n";
import { FONTS, useTheme } from "../../lib/theme";
import { getDishes, getRestaurants, getTopCritics } from "../../lib/api";

export default function Explore() {
  const c = useTheme();
  const { t } = useLang();
  const f = useFormat();
  const [tab, setTab] = useState("places");
  const [area, setArea] = useState(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => { const h = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(h); }, [query]);

  const places = useAsync(() => getRestaurants({ area, search }), [area, search]);
  const dishes = useAsync(getDishes, []);
  const critics = useAsync(getTopCritics, []);
  const dishList = (dishes.data || []).filter((d) => !search || (d.name_en + " " + (d.name_bn || "")).toLowerCase().includes(search.toLowerCase()));

  return (
    <Screen onRefresh={() => Promise.all([places.reload(), critics.reload()])}>
      <T v="display">{t("explore")}</T>
      <Row gap={8} style={{ backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 12 }}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t("searchPh")} placeholderTextColor={c.muted}
          style={[styles.input, { flex: 1, color: c.ink, paddingHorizontal: 0 }]} returnKeyType="search" accessibilityLabel={t("searchPh")} />
        {query ? <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear"><Ionicons name="close-circle" size={18} color={c.muted} /></Pressable> : null}
      </Row>
      <Row gap={8}>
        <Chip label={t("places")} icon="restaurant" active={tab === "places"} onPress={() => setTab("places")} />
        <Chip label={t("dishes")} icon="fast-food" active={tab === "dishes"} onPress={() => setTab("dishes")} />
        <Chip label={t("topCritics")} icon="ribbon" active={tab === "critics"} onPress={() => setTab("critics")} />
      </Row>

      {tab === "places" ? (
        <>
          <ChipRow>
            <Chip label={t("allAreas")} active={!area} onPress={() => setArea(null)} />
            {Object.keys(AREAS).filter((k) => k !== "other").map((k) => <Chip key={k} label={f.area(k)} active={area === k} onPress={() => setArea(k)} />)}
          </ChipRow>
          {places.loading ? <Loading /> : places.error ? <ErrorState onRetry={places.reload} /> : !places.data.length ? <Empty text={t("noResults")} /> : (
            <View>{places.data.map((r) => <RestaurantRow key={r.id} r={r} />)}</View>
          )}
          <Button kind="ghost" icon="add" title={t("addPlace")} onPress={() => router.push("/new-place")} />
        </>
      ) : null}

      {tab === "dishes" ? (
        dishes.loading ? <Loading /> : dishes.error ? <ErrorState onRetry={dishes.reload} /> : !dishList.length ? <Empty text={t("noResults")} /> : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {dishList.map((d) => (
              <Pressable key={d.id} onPress={() => router.push(`/dish/${d.id}`)} style={{ width: "47%", flexGrow: 1, borderRadius: 20, overflow: "hidden", backgroundColor: c.surface }}>
                <Image source={d.photo_url ? { uri: d.photo_url } : null} style={{ width: "100%", aspectRatio: 1.2, backgroundColor: c.surfaceAlt }} contentFit="cover" transition={150} />
                <View style={{ padding: 10, gap: 1 }}>
                  <T v="eyebrow" color={c.primary}>{t("bestOf")}</T>
                  <T v="h3" numberOfLines={1}>{f.dishName(d)}</T>
                </View>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {tab === "critics" ? (
        critics.loading ? <Loading /> : critics.error ? <ErrorState onRetry={critics.reload} /> : (
          <View style={{ gap: 4 }}>
            {critics.data.map((p) => (
              <Pressable key={p.id} onPress={() => router.push(`/user/${p.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
                <Avatar name={p.display_name} url={p.avatar_url} size={52} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Row gap={6}><T v="h3">{p.display_name}</T><RoleBadges role={p.role} club={p.club} /></Row>
                  <T v="small" muted numberOfLines={1}>{p.bio}</T>
                  <T v="small" muted>{f.num(p.review_count)} {t("reviewsN")} · {f.num(p.followers)} {t("followers")}</T>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.muted} />
              </Pressable>
            ))}
          </View>
        )
      ) : null}
    </Screen>
  );
}
