export function getTimeTheme() {
  const h = new Date().getHours();

  if (h >= 6 && h < 11) return {
    id: "manha", label: "Manhã", icon: "🌅",
    bg: "#fff7ef", bgCard: "rgba(255,255,255,0.65)", bgCardBorder: "rgba(210,170,140,0.18)",
    header: "#fff7ef", text: "#3a2a20", textSub: "#9b7c68", textMuted: "#c8aa98",
    accent: "#d9895b", accentText: "#fff", green: "#6fa886", blue: "#7da0bd",
    inputBg: "rgba(255,255,255,0.75)", inputBorder: "rgba(180,130,100,0.18)",
    divider: "rgba(160,120,90,0.12)", scrollThumb: "#d8c4b8", modalBg: "#fff3ea", danger: "#c96b6b",
  };

  if (h >= 11 && h < 18) return {
    id: "tarde", label: "Tarde", icon: "☀️",
    bg: "#111108", bgCard: "rgba(255,220,60,0.04)", bgCardBorder: "rgba(255,200,40,0.1)",
    header: "#111108", text: "#f5e8c0", textSub: "#9a8050", textMuted: "#4a3820",
    accent: "#f0b84a", accentText: "#111108", green: "#7ec8a4", blue: "#a8bfd4",
    inputBg: "rgba(255,200,60,0.07)", inputBorder: "rgba(255,200,60,0.14)",
    divider: "rgba(255,200,60,0.08)", scrollThumb: "#3a3010", modalBg: "#1a1610", danger: "#ff6b6b",
  };

  if (h >= 18 && h < 21) return {
    id: "noite", label: "Noite", icon: "🌆",
    bg: "#0e0a16", bgCard: "rgba(180,80,255,0.04)", bgCardBorder: "rgba(180,80,255,0.1)",
    header: "#0e0a16", text: "#e8d0f8", textSub: "#7a5888", textMuted: "#3a2848",
    accent: "#b870ff", accentText: "#0e0a16", green: "#7ec8a4", blue: "#ff9f60",
    inputBg: "rgba(180,80,255,0.08)", inputBorder: "rgba(180,80,255,0.14)",
    divider: "rgba(180,80,255,0.08)", scrollThumb: "#3a2050", modalBg: "#180e22", danger: "#ff6b6b",
  };

  return {
    id: "madrugada", label: "Madrugada", icon: "🌙",
    bg: "#060810", bgCard: "rgba(60,100,255,0.04)", bgCardBorder: "rgba(60,100,255,0.09)",
    header: "#060810", text: "#b8c8f0", textSub: "#3a4860", textMuted: "#1e2840",
    accent: "#4870ff", accentText: "#fff", green: "#50a898", blue: "#7898e0",
    inputBg: "rgba(60,100,255,0.08)", inputBorder: "rgba(60,100,255,0.14)",
    divider: "rgba(60,100,255,0.07)", scrollThumb: "#181e38", modalBg: "#0c1020", danger: "#ff6b6b",
  };
}
