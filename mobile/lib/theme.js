import { useColorScheme } from "react-native";

// The Palate palette
export const PALETTE = {
  coral: "#FF9292",
  ketchup: "#CA1B20",
  bright: "#FFF0E6",
  sauce: "#FC6E35",
  aubergine: "#570807",
};

const light = {
  bg: PALETTE.bright,
  surface: "#FFFFFF",
  surfaceAlt: "#FFE6DA",
  ink: "#2E0605",
  heading: PALETTE.aubergine,
  muted: "#8B5A53",
  line: "#F1D3C4",
  primary: PALETTE.ketchup,
  primarySoft: "#FFD9D3",
  onPrimary: PALETTE.bright,
  accent: PALETTE.sauce,
  accentSoft: "#FFE0D1",
  coral: PALETTE.coral,
  good: "#1D8A4E",
  danger: "#B3261E",
  overlay: "rgba(46,6,5,0.55)",
  tabBar: "#FFFFFF",
};

const dark = {
  bg: "#1B0504",
  surface: "#2A0B09",
  surfaceAlt: "#3A110E",
  ink: PALETTE.bright,
  heading: PALETTE.bright,
  muted: "#D2A79F",
  line: "#47170F",
  primary: "#E8343A",
  primarySoft: "#4D1311",
  onPrimary: PALETTE.bright,
  accent: PALETTE.sauce,
  accentSoft: "#4A1F10",
  coral: PALETTE.coral,
  good: "#6FD39A",
  danger: "#FF8A80",
  overlay: "rgba(0,0,0,0.6)",
  tabBar: "#230806",
};

export const FONTS = {
  display: "BricolageGrotesque_800ExtraBold",
  displayMid: "BricolageGrotesque_600SemiBold",
  body: "HindSiliguri_400Regular",
  bodyBold: "HindSiliguri_600SemiBold",
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? { ...dark, dark: true } : { ...light, dark: false };
}

// Score colours: high scores glow ketchup, middle ones sauce, low ones coral
export function scoreColors(c, score) {
  if (score == null) return { bg: c.line, fg: c.muted };
  if (score >= 8) return { bg: c.primary, fg: c.onPrimary };
  if (score >= 6.5) return { bg: c.accent, fg: "#FFFFFF" };
  return { bg: c.coral, fg: PALETTE.aubergine };
}
