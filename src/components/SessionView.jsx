import { useState } from "react";
import ExerciseRow from "./ExerciseRow";
import AddMachineModal from "./AddMachineModal";
import HistoryModal from "./HistoryModal";
import { calcDuration } from "../lib/utils";

function useTimer(startedAt, active) {
  const { useState: us, useEffect: ue } = require("react");
  const [elapsed, setElapsed] = us(0);
  ue(() => {
    if (!active || !startedAt) return;
    const upd = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);
  const s = elapsed % 60, m = Math.floor(elapsed / 60) % 60, hh = Math.floor(elapsed / 3600);
  return hh > 0
    ? `${String(hh).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function SessionView({ session, onUpdate, onSave, theme, onFinish, data }) {
  const T = theme;
  const [modal, setModal] = useState(null);
  const [histModal, setHistModal] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const readonly = session.status === "done" && !editMode;
  const isActive = session.status === "active";
  const isManualReopened = session.manual && session.status === "active" && session.finishedAt === null;
  const timer = useTimer(session.startedAt, isActive && !isManualReopened);
  const dur = calcDuration(session.startedAt, session.finishedAt);

  const addEx = (group, machine) => {
    const allExs = (data || []).flatMap(s => [...(s.lower || []), ...(s.upper || [])]).filter(e => e.machine === machine);
    const allHist = allExs.flatMap(e => e.weightHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastEntry = allHist[0];
    onUpdate({
      ...session,
      [group]: [...(session[group] || []), {
        id: Date.now(), machine,
        weight: lastEntry?.weight || "", rp: lastEntry?.rp || "",
        reps: lastEntry?.reps || "", series: lastEntry?.series || "",
        weightHistory: [],
      }],
    });
    setModal(null);
  };

  const updEx = (group, id, d) => onUpdate({ ...session, [group]: session[group].map(e => e.id === id ? { ...e, ...d } : e) });
  const delEx = (group, id) => onUpdate({ ...session, [group]: session[group].filter(e => e.id !== id) });
  const handleSaveEdit = () => { onSave(session); setEditMode(false); };

  const groups = [
    { key: "lower", label: "Lower Body", emoji: "🦵", color: T.green },
    { key: "upper", label: "Upper Body", emoji: "💪", color: T.blue },
  ];

  const histEx = histModal ? [...(session.lower || []), ...(session.upper || [])].find(e => e.id === histModal) : null;

  const statusColor = session.status === "done" ? T.green : session.status === "active" ? T.accent : T.textSub;
  const statusBg = session.status === "done" ? `${T.green}10` : session.status === "active" ? `${T.accent}08` : T.bgCard;
  const statusBorder = session.status === "done" ? `${T.green}40` : session.status === "active" ? `${T.accent}35` : T.bgCardBorder;

  return (
    <div>
      {/* Status card */}
      <div style={{ borderRadius: "16px", marginBottom: "20px", border: `1px solid ${statusBorder}`, background: statusBg }}>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>{session.status === "done" ? "✅" : session.status === "active" ? "🔥" : "⏸️"}</span>
            <div>
              <p style={{ color: statusColor, fontSize: "11px", fontWeight: 700, margin: 0, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                {session.status === "done" ? (editMode ? "Modo Edição ✏️" : "Treino Finalizado") : session.status === "active" ? "Em Andamento" : "Não Iniciado"}
              </p>
              {isActive && !isManualReopened && <p style={{ color: T.accent, fontSize: "22px", fontWeight: 700, margin: "2px 0 0", fontFamily: "'DM Mono',monospace", letterSpacing: "2px" }}>{timer}</p>}
              {isActive && isManualReopened && <p style={{ color: T.textMuted, fontSize: "12px", margin: "3px 0 0", fontFamily: "'DM Sans',sans-serif" }}>Edite e finalize quando quiser</p>}
              {session.status === "done" && dur && !editMode && <p style={{ color: T.textSub, fontSize: "12px", margin: "3px 0 0", fontFamily: "'DM Sans',sans-serif" }}>Duração: <strong>{dur}</strong></p>}
              {session.status === "pending" && <p style={{ color: T.textMuted, fontSize: "12px", margin: "3px 0 0", fontFamily: "'DM Sans',sans-serif" }}>Toque em Iniciar quando estiver pronto</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {session.status === "done" && session.manual && (
              editMode
                ? <button onClick={handleSaveEdit} style={{ background: T.green, border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, fontSize: "12px", padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✓ Salvar</button>
                : <button onClick={() => setEditMode(true)} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "10px", color: T.textSub, fontSize: "12px", padding: "8px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✏️ Editar</button>
            )}
            {session.status === "done" && !session.manual && (
              <button onClick={() => onUpdate({ ...session, status: "active", finishedAt: null })} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "10px", color: T.textSub, fontSize: "12px", padding: "8px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>↩ Reabrir</button>
            )}
          </div>
        </div>
      </div>

      {/* Exercise groups */}
      {groups.map(g => (
        <div key={g.key} style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px" }}>{g.emoji}</span>
              <span style={{ color: g.color, fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>{g.label}</span>
              <span style={{ color: T.textMuted, fontSize: "11px", fontFamily: "'DM Sans',sans-serif" }}>({session[g.key]?.length || 0})</span>
            </div>
            {!readonly && (
              <button onClick={() => setModal(g.key)} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "8px", color: T.textSub, fontSize: "12px", padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Máquina</button>
            )}
          </div>

          {(session[g.key] || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px", color: T.textMuted, fontSize: "12px", fontFamily: "'DM Sans',sans-serif", border: `1px dashed ${T.bgCardBorder}`, borderRadius: "10px" }}>
              {readonly ? "Nenhum exercício registrado" : "Adicione uma máquina"}
            </div>
          ) : (session[g.key] || []).map(ex => (
            <ExerciseRow key={ex.id} exercise={ex} theme={T} readonly={readonly}
              onChange={d => updEx(g.key, ex.id, d)}
              onDelete={() => delEx(g.key, ex.id)}
              onShowHistory={() => setHistModal(ex.id)}
            />
          ))}
        </div>
      ))}

      {modal && <AddMachineModal group={modal} theme={T} onAdd={m => addEx(modal, m)} onClose={() => setModal(null)} existingMachines={(session[modal] || []).map(e => e.machine)} />}
      {histEx && <HistoryModal machine={histEx.machine} history={histEx.weightHistory || []} theme={T} onClose={() => setHistModal(null)} />}
    </div>
  );
}
