export default function HistoryModal({ machine, history, theme, onClose }) {
  const T = theme;
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const max = history.reduce((m, h) => Math.max(m, parseFloat(h.weight) || 0), 0);
  const fmt = iso => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const fmtF = iso => new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.bgCardBorder}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: "480px", maxHeight: "75vh", overflowY: "auto" }}>
        <div style={{ width: "36px", height: "4px", background: `${T.accent}40`, borderRadius: "2px", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <p style={{ color: T.textSub, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>Histórico de carga</p>
            <h3 style={{ color: T.text, fontSize: "18px", fontWeight: 700, margin: "4px 0 0", fontFamily: "'DM Sans',sans-serif" }}>{machine}</h3>
          </div>
          {max > 0 && (
            <div style={{ textAlign: "right" }}>
              <p style={{ color: T.textSub, fontSize: "10px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>MÁXIMO</p>
              <p style={{ color: T.accent, fontSize: "22px", fontWeight: 700, margin: "2px 0 0", fontFamily: "'DM Mono',monospace" }}>{max}kg</p>
            </div>
          )}
        </div>

        {history.length > 1 && (() => {
          const cd = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
          const mw = Math.max(...cd.map(h => parseFloat(h.weight) || 0));
          return (
            <div style={{ marginBottom: "20px", padding: "14px", background: T.bgCard, borderRadius: "12px", border: `1px solid ${T.bgCardBorder}` }}>
              <p style={{ color: T.textMuted, fontSize: "10px", letterSpacing: "1.5px", marginBottom: "10px", fontFamily: "'DM Sans',sans-serif" }}>EVOLUÇÃO</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "56px" }}>
                {cd.map((h, i) => {
                  const pct = mw > 0 ? ((parseFloat(h.weight) || 0) / mw) * 100 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <div style={{ width: "100%", height: `${Math.max(pct * 0.56, 3)}px`, background: i === cd.length - 1 ? T.accent : `${T.accent}40`, borderRadius: "3px 3px 0 0" }} />
                      <span style={{ color: T.textMuted, fontSize: "8px", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{fmt(h.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sorted.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: T.bgCard, borderRadius: "10px", border: `1px solid ${T.bgCardBorder}` }}>
              <div>
                <p style={{ color: T.text, fontSize: "16px", fontWeight: 600, margin: 0, fontFamily: "'DM Mono',monospace" }}>{h.weight}kg</p>
                <p style={{ color: T.textSub, fontSize: "11px", margin: "3px 0 0", fontFamily: "'DM Sans',sans-serif" }}>
                  {h.series ? `${h.series}x · ` : ""}{h.reps ? `${h.reps} reps` : ""}{h.rp ? ` · RP ${h.rp}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: T.textSub, fontSize: "12px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{fmtF(h.date)}</p>
                {i === 0 && <span style={{ background: `${T.accent}20`, color: T.accent, fontSize: "10px", padding: "2px 7px", borderRadius: "5px" }}>atual</span>}
              </div>
            </div>
          ))}
        </div>

        {history.length === 0 && <p style={{ color: T.textMuted, textAlign: "center", fontSize: "13px", padding: "30px 0", fontFamily: "'DM Sans',sans-serif" }}>Sem histórico ainda.</p>}
      </div>
    </div>
  );
}
