import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import { useAuth } from "./auth";
import { useLang } from "./i18n";
import { report, toggle } from "./api";

export function notify(msg) {
  if (Platform.OS === "web") { try { window.alert(msg); } catch (e) {} } else Alert.alert("Palate", msg);
}

// Like, helpful and report for any list of reviews. setData updates the list in place.
export function useReviewActions(setData) {
  const { user } = useAuth();
  const { t } = useLang();
  const needUser = () => { if (!user) { router.push("/sign-in"); return true; } return false; };
  const patch = (id, fn) => setData((rows) => (rows || []).map((r) => (r.id === id ? { ...r, ...fn(r) } : r)));

  return {
    like: async (r) => {
      if (needUser()) return;
      const on = !r.liked;
      patch(r.id, (x) => ({ liked: on, like_count: Number(x.like_count || 0) + (on ? 1 : -1) }));
      try { await toggle("likes", { user_id: user.id, review_id: r.id }, on); }
      catch { patch(r.id, (x) => ({ liked: !on, like_count: Number(x.like_count || 0) + (on ? -1 : 1) })); notify(t("errorLoad")); }
    },
    helpful: async (r) => {
      if (needUser()) return;
      if (r.user_id === user.id) return;
      const on = !r.markedHelpful;
      patch(r.id, (x) => ({ markedHelpful: on, helpful_count: Number(x.helpful_count || 0) + (on ? 1 : -1) }));
      try { await toggle("review_helpful", { user_id: user.id, review_id: r.id }, on); }
      catch { patch(r.id, (x) => ({ markedHelpful: !on, helpful_count: Number(x.helpful_count || 0) + (on ? -1 : 1) })); notify(t("errorLoad")); }
    },
    report: (r) => {
      if (needUser()) return;
      const send = async (reason) => { try { await report(user.id, r.id, reason); notify(t("reported")); } catch { notify(t("errorLoad")); } };
      if (Platform.OS === "web") return send("Reported from the app");
      Alert.alert(t("report"), undefined, [
        { text: "Fake or paid review", onPress: () => send("Fake or paid review") },
        { text: "Photo isn't from this place", onPress: () => send("Photo isn't from this place") },
        { text: "Rude or offensive", onPress: () => send("Rude or offensive") },
        { text: "Cancel", style: "cancel" },
      ]);
    },
  };
}
