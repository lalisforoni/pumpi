import { useState } from "react";
import { defaultMachines, repOptions } from "../lib/personas";

export default function ManualSessionModal({ theme, onSave, onClose, allSessions }) {
  const T = theme;
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [durMin, setDurMin] = useState("");
  const [lower, setLower] = useState([]);
  const [upper, setUpper] = useState([]);
  const [addingGroup, setAddingGroup] = useState(null);
  const [customMachine, setCustomMachine] = useState("");

  const addEx = (group, machine) => {
    const allExs = allSessions.flatMap(s => [...(s.lower || []), ...(s.upper || [])]).filter(e => e.machine === machine);
    const allHist = allExs.flatMap(e => e.weightHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    const last = allHist[0];
    const ex = { id: Date.now(), machine, weight: last?.weight || "", rp: last?.rp || "", reps: last?.reps || "", series: "", weightHistory: [] };
    if (group === "lower") setLower(p => [...p, ex]);
    else setUpper(p => [...p, ex]);
    setAddingGroup(null);
    setCustomMachine("");
  };

  const updEx = (group, id, val) => {
    if (group === "lower") setLower(p => p.map(e => e.id === id ? { ...e, ...val } : e));
    else setUpper(p => p.map(e => e.id === id ? { ...e, ...val } : e));
  };

  const delEx = (group, id) => {
    if (group === "lower") setLower(p => p.filter(e => e.id !== id));
    else setUpper(p => p.filter(e => e.id !== id));
  };

  const handleSave = () => {
    const dateObj = new Date(date + "T12:00:00");
    const dur = durMin ? parseInt(durMin) * 60000 : 0;
    const addHistory = (exs) => exs.map(ex => ({
      ...ex,
      weightHistory: ex.weight ? [{ weight: ex.weight, reps: ex.reps, rp: ex.rp, series: ex.series, date: dateObj.toISOString() }] : [],
    }));
    const session = {
      id: Date.now(),
      date: dateObj.toISOString(),
      status: "done",
      startedAt: dateObj.getTime(),
      finishedAt: dateObj.getTime() + dur,
      lower: addHistory(lower),
      upper: addHistory(upper),
      manual: true,
    };
    onSave(session);
  };

  const inp = {
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: "10px", color: T.text, fontSize: "14px",
    padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", outline: "none",
  };

  const groups = [
    { key: "lower", label: "Lower Body", emoji: "🦵", list: lower },
    { key: "upper", label: "Upper Body", emoji: "💪", list: upper },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.bgCardBorder}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <div style={{ width: "36px", height: "4px", background: `${T.accent}40`, borderRadius: "2px", margin: "0 auto 20px" }} />
        <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: T.textMuted, fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>✕</button>

        <p style={{ color: T.accent, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", marginBottom: "16px" }}>📅 Lançar Treino</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <div>
            <p style={{ color: T.textMuted, fontSize: "11px", fontFamily: "'DM Sans',sans-serif", marginBottom: "6px" }}>DATA</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, width: "100%" }} />
          </div>
          <div>
            <p style={{ color: T.textMuted, fontSize: "11px", fontFamily: "'DM Sans',sans-serif", marginBottom: "6px" }}>DURAÇÃO (min)</p>
            <input type="number" placeholder="ex: 46" value={durMin} onChange={e => setDurMin(e.target.value)} style={{ ...inp, width: "100%" }} />
          </div>
        </div>

        {groups.map(g => (
          <div key={g.key} style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ color: T.textSub, fontSize: "12px", fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>{g.emoji} {g.label} ({g.list.length})</span>
              <button onClick={() => setAddingGroup(addingGroup === g.key ? null : g.key)}
                style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "8px", color: T.textSub, fontSize: "12px", padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                + Máquina
              </button>
            </div>

            {addingGroup === g.key && (
              <>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <input placeholder="Nome da máquina..." value={customMachine}
                    onChange={e => setCustomMachine(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && customMachine.trim() && addEx(g.key, customMachine.trim())}
                    style={{ ...inp, flex: 1 }} />
                  <button onClick={() => customMachine.trim() && addEx(g.key, customMachine.trim())}
                    style={{ background: T.accent, border: "none", borderRadius: "10px", color: T.accentText, fontWeight: 700, padding: "10px 14px", cursor: "pointer" }}>+</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {defaultMachines[g.key].map(s => (
                    <button key={s} onClick={() => addEx(g.key, s)}
                      style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "20px", color: T.textSub, fontSize: "11px", padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {g.list.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 58px 48px 62px 52px 28px", gap: "4px", padding: "4px 8px", marginBottom: "4px" }}>
                {["Máquina", "Peso", "Séries", "Reps", "RP", ""].map((h, i) => (
                  <span key={i} style={{ color: T.textMuted, fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", textAlign: i > 0 ? "center" : "left", fontFamily: "'DM Sans',sans-serif" }}>{h}</span>
                ))}
              </div>
            )}

            {g.list.map(ex => (
              <div key={ex.id} style={{ display: "grid", gridTemplateColumns: "1fr 58px 48px 62px 52px 28px", gap: "4px", alignItems: "center", padding: "8px", background: T.bgCard, borderRadius: "10px", border: `1px solid ${T.bgCardBorder}`, marginBottom: "6px" }}>
                <span style={{ color: T.text, fontSize: "12px", fontFamily: "'DM Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.machine}</span>
                <input type="text" placeholder="kg" value={ex.weight} onChange={e => updEx(g.key, ex.id, { weight: e.target.value })} style={{ ...inp, padding: "5px", textAlign: "center", fontSize: "12px", color: T.accent }} />
                <input type="number" placeholder="4" value={ex.series} onChange={e => updEx(g.key, ex.id, { series: e.target.value })} style={{ ...inp, padding: "5px", textAlign: "center", fontSize: "12px", color: T.green }} />
                <select value={ex.reps} onChange={e => updEx(g.key, ex.id, { reps: e.target.value })} style={{ ...inp, padding: "5px", fontSize: "11px", color: T.blue }}>
                  <option value="">rep</option>
                  {repOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="number" placeholder="RP" value={ex.rp} onChange={e => updEx(g.key, ex.id, { rp: e.target.value })} style={{ ...inp, padding: "5px", textAlign: "center", fontSize: "12px", color: T.green }} />
                <button onClick={() => delEx(g.key, ex.id)} style={{ background: "rgba(255,80,80,0.1)", border: "none", borderRadius: "6px", color: "#ff6b6b", fontSize: "14px", cursor: "pointer", padding: "4px 0", width: "28px" }}>×</button>
              </div>
            ))}
          </div>
        ))}

        <button onClick={handleSave}
          style={{ background: T.accent, border: "none", borderRadius: "14px", color: T.accentText, fontWeight: 800, fontSize: "15px", padding: "14px", width: "100%", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          Salvar Treino 🍑
        </button>
      </div>
    </div>
  );
}
