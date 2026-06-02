import { useState } from "react";
import Confetti from "./Confetti";
import { calcDuration } from "../lib/utils";

export default function CelebrationModal({ theme, session, onClose }) {
  const [conf, setConf] = useState(true);
  const T = theme;

  const total = (session.lower?.length || 0) + (session.upper?.length || 0);
  const dur = calcDuration(session.startedAt, session.finishedAt);
  const durMin = session.startedAt && session.finishedAt
    ? Math.floor((session.finishedAt - session.startedAt) / 60000)
    : 0;
  const totalKg = [...(session.lower || []), ...(session.upper || [])].reduce((a, ex) => {
    return a + (parseFloat(ex.weight) || 0) * (parseInt(ex.series) || 0);
  }, 0);

  return (
    <>
      {conf && <Confetti onDone={() => setConf(false)} />}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: T.id === "manha" ? "rgba(255,247,239,0.96)" : "rgba(0,0,0,0.92)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: T.modalBg, border: `1px solid ${T.bgCardBorder}`,
            borderRadius: "28px", padding: "36px 28px 28px",
            textAlign: "center", maxWidth: "320px", width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "6px", lineHeight: 1 }}>🍑</div>
          <p style={{ color: T.textMuted, fontSize: "10px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", marginBottom: "6px" }}>
            Treino registrado
          </p>
          <h2 style={{ color: T.text, fontSize: "26px", fontWeight: 800, fontFamily: "'DM Sans',sans-serif", letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: "24px" }}>
            +1 treino.<br />{durMin > 0 ? `+${durMin} minutos.` : "Concluído."}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            {[
              { val: total, label: "exercícios" },
              { val: dur || "—", label: "duração" },
              { val: totalKg > 0 ? `${totalKg}kg` : "—", label: "movimentados" },
            ].map((s, i) => (
              <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "12px", padding: "12px 6px" }}>
                <p style={{ color: T.accent, fontSize: "16px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace" }}>{s.val}</p>
                <p style={{ color: T.textMuted, fontSize: "10px", margin: "3px 0 0", fontFamily: "'DM Sans',sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", justifyContent: "center", marginBottom: "20px" }}>
            {[...(session.lower || []), ...(session.upper || [])].map((ex, i) => (
              <span key={i} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "6px", padding: "4px 9px", color: T.textSub, fontSize: "11px", fontFamily: "'DM Sans',sans-serif" }}>
                {ex.machine}{ex.weight ? ` ${ex.weight}kg` : ""}
              </span>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{ background: T.accent, border: "none", borderRadius: "14px", color: T.accentText, fontWeight: 700, fontSize: "14px", padding: "14px", cursor: "pointer", width: "100%", fontFamily: "'DM Sans',sans-serif" }}
          >
            Voltar para meus treinos
          </button>
        </div>
      </div>
    </>
  );
}
