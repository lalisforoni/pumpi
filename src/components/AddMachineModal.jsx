import { useState } from "react";
import { defaultMachines } from "../lib/personas";

export default function AddMachineModal({ group, onAdd, onClose, existingMachines, theme }) {
  const T = theme;
  const [custom, setCustom] = useState("");
  const suggestions = defaultMachines[group].filter(m => !existingMachines.includes(m));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.bgCardBorder}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: "480px", maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ width: "36px", height: "4px", background: `${T.accent}50`, borderRadius: "2px", margin: "0 auto 20px" }} />
        <p style={{ color: T.textSub, fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", fontFamily: "'DM Sans',sans-serif" }}>
          Adicionar · {group === "lower" ? "Lower Body" : "Upper Body"}
        </p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input placeholder="Nome personalizado..." value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && custom.trim() && onAdd(custom.trim())}
            style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.text, fontSize: "14px", padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
          />
          <button onClick={() => custom.trim() && onAdd(custom.trim())}
            style={{ background: T.accent, border: "none", borderRadius: "10px", color: T.accentText, fontWeight: 700, fontSize: "14px", padding: "10px 16px", cursor: "pointer" }}>
            +
          </button>
        </div>

        {suggestions.length > 0 && (
          <>
            <p style={{ color: T.textMuted, fontSize: "11px", marginBottom: "10px", fontFamily: "'DM Sans',sans-serif" }}>SUGESTÕES</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => onAdd(s)}
                  style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "20px", color: T.textSub, fontSize: "12px", padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
