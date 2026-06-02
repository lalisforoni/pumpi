import { useState, useEffect } from "react";
import { repOptions } from "../lib/personas";

export default function ExerciseRow({ exercise, onChange, onDelete, onShowHistory, theme, readonly }) {
  const T = theme;
  const [localWeight, setLocalWeight] = useState(exercise.weight || "");
  const hasH = (exercise.weightHistory || []).length > 0;
  const last = hasH ? exercise.weightHistory[exercise.weightHistory.length - 1] : null;
  const fmt = iso => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  useEffect(() => { setLocalWeight(exercise.weight || ""); }, [exercise.id]);

  const handleWeightChange = (val) => {
    setLocalWeight(val);
    onChange({ ...exercise, weight: val });
  };

  const handleWeightBlur = (val) => {
    const lastWeight = exercise.weightHistory?.[exercise.weightHistory.length - 1]?.weight || "";
    if (val && val !== lastWeight) {
      const entry = { weight: val, reps: exercise.reps, rp: exercise.rp, series: exercise.series, date: new Date().toISOString() };
      onChange({ ...exercise, weight: val, weightHistory: [...(exercise.weightHistory || []), entry] });
    }
  };

  const inp = (color) => ({
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: "7px", color, fontSize: "13px",
    padding: "6px 4px", width: "100%", textAlign: "center",
    fontFamily: "'DM Mono',monospace", outline: "none",
  });

  return (
    <div style={{ padding: "10px", background: T.bgCard, borderRadius: "12px", border: `1px solid ${T.bgCardBorder}`, marginBottom: "8px", opacity: readonly ? 0.72 : 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 70px 55px 36px", gap: "5px", alignItems: "center" }}>
        <div>
          <span style={{ color: T.text, fontSize: "13px", fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>{exercise.machine}</span>
          {last && <p style={{ color: T.textMuted, fontSize: "10px", margin: "2px 0 0", fontFamily: "'DM Sans',sans-serif" }}>atualizado {fmt(last.date)}</p>}
        </div>
        <input type="text" placeholder="kg" value={localWeight} disabled={readonly}
          onChange={e => !readonly && handleWeightChange(e.target.value)}
          onBlur={e => !readonly && handleWeightBlur(e.target.value)}
          style={{ ...inp(T.accent), padding: "6px 5px" }}
        />
        <input type="number" placeholder="Sér" value={exercise.series || ""} disabled={readonly}
          onChange={e => !readonly && onChange({ ...exercise, series: e.target.value })}
          style={inp(T.green)}
        />
        <select value={exercise.reps || ""} disabled={readonly}
          onChange={e => !readonly && onChange({ ...exercise, reps: e.target.value })}
          style={{ ...inp(T.blue), fontSize: "11px" }}
        >
          <option value="">rep</option>
          {repOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input type="number" placeholder="RP" value={exercise.rp || ""} disabled={readonly}
          onChange={e => !readonly && onChange({ ...exercise, rp: e.target.value })}
          style={inp(T.green)}
        />
        <button onClick={onDelete} disabled={readonly}
          style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: "7px", color: "#ff6b6b", fontSize: "15px", cursor: readonly ? "default" : "pointer", padding: "4px 0", width: "36px", display: "flex", alignItems: "center", justifyContent: "center", opacity: readonly ? 0.4 : 1 }}>
          ×
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 70px 55px 36px", gap: "5px", padding: "3px 0 0" }}>
        {["", "Peso", "Sér", "Reps", "RP", ""].map((h, i) => (
          <span key={i} style={{ color: T.textMuted, fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>{h}</span>
        ))}
      </div>

      <button onClick={onShowHistory}
        style={{ marginTop: "8px", width: "100%", background: hasH ? `${T.accent}10` : "transparent", border: hasH ? `1px solid ${T.accent}25` : `1px solid ${T.bgCardBorder}`, borderRadius: "8px", padding: "6px", color: hasH ? T.accent : T.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
        <span>📈</span>
        {hasH ? `Ver evolução · ${(exercise.weightHistory || []).length} registros` : "Sem histórico ainda"}
      </button>
    </div>
  );
}
