export function getTimeTheme() {
  const h = new Date().getHours();

  // 🌅 MANHÃ + TARDE (06:00 → 17:59)
  if (h >= 6 && h < 18) {
    return {
      id: "dia",
      label: "Dia",
      icon: "☀️",

      bg: "#fff7ef",
      bgCard: "rgba(255,255,255,0.72)",
      bgCardBorder: "rgba(210,170,140,0.18)",

      header: "#fff7ef",

      text: "#3a2a20",
      textSub: "#9b7c68",
      textMuted: "#c8aa98",

      accent: "#d9895b",
      accentText: "#fff",

      green: "#6fa886",
      blue: "#7da0bd",

      inputBg: "rgba(255,255,255,0.82)",
      inputBorder: "rgba(180,130,100,0.18)",

      divider: "rgba(160,120,90,0.12)",

      scrollThumb: "#d8c4b8",
      modalBg: "#fff3ea",

      danger: "#c96b6b",
    };
  }

  // 🌆 NOITE (18:00 → 20:59)
  if (h >= 18 && h < 21) {
    return {
      id: "noite",
      label: "Noite",
      icon: "🌆",

      bg: "#0e0a16",
      bgCard: "rgba(180,80,255,0.04)",
      bgCardBorder: "rgba(180,80,255,0.1)",

      header: "#0e0a16",

      text: "#e8d0f8",
      textSub: "#7a5888",
      textMuted: "#3a2848",

      accent: "#b870ff",
      accentText: "#0e0a16",

      green: "#7ec8a4",
      blue: "#ff9f60",

      inputBg: "rgba(180,80,255,0.08)",
      inputBorder: "rgba(180,80,255,0.14)",

      divider: "rgba(180,80,255,0.08)",

      scrollThumb: "#3a2050",
      modalBg: "#180e22",

      danger: "#ff6b6b",
    };
  }

  // 🌙 MADRUGADA (21:00 → 05:59)
  return {
    id: "madrugada",
    label: "Madrugada",
    icon: "🌙",

    bg: "#060810",
    bgCard: "rgba(60,100,255,0.04)",
    bgCardBorder: "rgba(60,100,255,0.09)",

    header: "#060810",

    text: "#b8c8f0",
    textSub: "#3a4860",
    textMuted: "#1e2840",

    accent: "#4870ff",
    accentText: "#fff",

    green: "#50a898",
    blue: "#7898e0",

    inputBg: "rgba(60,100,255,0.08)",
    inputBorder: "rgba(60,100,255,0.14)",

    divider: "rgba(60,100,255,0.07)",

    scrollThumb: "#181e38",
    modalBg: "#0c1020",

    danger: "#ff6b6b",
  };
}
