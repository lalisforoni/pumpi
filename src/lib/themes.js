export const BRAND = {
  peach: "#FF9E80",
  coral: "#FF6B6B",
  cream: "#FFF5F0",
  black: "#1F1F1F",
  beige: "#F4E7DF",
  gray: "#A6A6A6",
  white: "#FFFFFF",
  success: "#4CAF50",
  gold: "#FFC857",
  lightGray: "#EAEAEA",
};

export function getTimeTheme() {
  const h = new Date().getHours();

  if (h >= 6 && h < 18) {
    return {
      id: "dia",
      label: "Dia",
      icon: "🍑",

      bg: BRAND.cream,
      bgCard: "rgba(255,255,255,0.78)",
      bgCardBorder: "rgba(255,158,128,0.22)",

      header: BRAND.cream,

      text: BRAND.black,
      textSub: "#8A6F64",
      textMuted: BRAND.gray,

      accent: BRAND.coral,
      accentText: BRAND.white,

      peach: BRAND.peach,
      coral: BRAND.coral,
      cream: BRAND.cream,

      green: BRAND.success,
      blue: BRAND.peach,
      gold: BRAND.gold,

      inputBg: "rgba(255,255,255,0.9)",
      inputBorder: "rgba(255,158,128,0.28)",

      divider: "rgba(31,31,31,0.08)",
      scrollThumb: BRAND.beige,

      modalBg: BRAND.cream,

      danger: BRAND.coral,
    };
  }

  return {
    id: "noite",
    label: "Noite",
    icon: "🍑",

    bg: BRAND.black,
    bgCard: "rgba(255,245,240,0.06)",
    bgCardBorder: "rgba(255,158,128,0.18)",

    header: BRAND.black,

    text: BRAND.cream,
    textSub: "#D8B8A8",
    textMuted: "#8C7A72",

    accent: BRAND.coral,
    accentText: BRAND.white,

    peach: BRAND.peach,
    coral: BRAND.coral,
    cream: BRAND.cream,

    green: BRAND.success,
    blue: BRAND.peach,
    gold: BRAND.gold,

    inputBg: "rgba(255,245,240,0.08)",
    inputBorder: "rgba(255,158,128,0.22)",

    divider: "rgba(255,245,240,0.08)",
    scrollThumb: "#4A3A34",

    modalBg: "#292322",

    danger: BRAND.coral,
  };
}
