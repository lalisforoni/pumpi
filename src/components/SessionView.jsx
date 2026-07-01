import { useState } from "react";
import { calcDuration } from "../lib/utils";
import AddMachineModal from "./AddMachineModal";
import ExerciseRow from "./ExerciseRow";
import HistoryModal from "./HistoryModal";
import useTimer from "../hooks/useTimer";

export default function SessionView({
  session,
  onUpdate,
  onSave,
  theme,
  data,
}) {
  const T = theme;

  const [modal, setModal] = useState(null);
  const [histModal, setHistModal] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const readonly = session.status === "done" && !editMode;
  const isActive = session.status === "active";
  const isTemplateSession = session.fromTemplate === true;

  const timer = useTimer(session.startedAt, isActive);
  const duration = calcDuration(session.startedAt, session.finishedAt);

  const allSessionExercises = [
    ...(session.lower || []),
    ...(session.upper || []),
  ];

  const totalTemplateExercises = allSessionExercises.length;
  const completedTemplateExercises = allSessionExercises.filter(
    (exercise) => exercise.completed
  ).length;

  const templateProgress =
    totalTemplateExercises > 0
      ? Math.round((completedTemplateExercises / totalTemplateExercises) * 100)
      : 0;

  const addExercise = (group, machine) => {
    const cleanMachine = String(machine || "").trim();
    if (!cleanMachine) return;

    const allExercises = (data || [])
      .flatMap((s) => [...(s.lower || []), ...(s.upper || [])])
      .filter((exercise) => exercise.machine === cleanMachine);

    const allHistory = allExercises
      .flatMap((exercise) => exercise.weightHistory || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const lastEntry = allHistory[0];

    const newExercise = {
      id: Date.now(),
      machine: cleanMachine,
      weight: lastEntry?.weight || "",
      rp: lastEntry?.rp || "",
      reps: lastEntry?.reps || "",
      series: lastEntry?.series || "",
      completed: false,
      weightHistory: [],
    };

    onUpdate({
      ...session,
      [group]: [...(session[group] || []), newExercise],
      updatedAt: Date.now(),
    });

    setModal(null);
  };

  const updateExercise = (group, id, updatedExercise) => {
    onUpdate({
      ...session,
      [group]: (session[group] || []).map((exercise) =>
        exercise.id === id ? { ...exercise, ...updatedExercise } : exercise
      ),
      updatedAt: Date.now(),
    });
  };

  const toggleExerciseCompleted = (group, exercise) => {
    if (!isTemplateSession || readonly) return;

    updateExercise(group, exercise.id, {
      completed: !exercise.completed,
    });
  };

  const deleteExercise = (group, id) => {
    onUpdate({
      ...session,
      [group]: (session[group] || []).filter(
        (exercise) => exercise.id !== id
      ),
      updatedAt: Date.now(),
    });
  };

  const handleSaveEdit = async () => {
    await onSave({
      ...session,
      status: "done",
      updatedAt: Date.now(),
    });

    setEditMode(false);
  };

  const groups = [
    { key: "lower", label: "Lower Body", emoji: "🦵", color: T.green },
    { key: "upper", label: "Upper Body", emoji: "💪", color: T.blue },
  ];

  const histExercise = histModal
    ? [...(session.lower || []), ...(session.upper || [])].find(
        (exercise) => exercise.id === histModal
      )
    : null;

  const statusInfo =
    session.status === "done"
      ? {
          eyebrow: editMode ? "Modo edição" : "Pump entregue",
          title: editMode ? "Ajuste seu treino" : "Treino concluído",
          subtitle: duration ? `Duração: ${duration}` : "Treino registrado.",
          icon: "🍑",
          color: T.green,
          bg: `${T.green}10`,
          border: `${T.green}35`,
        }
      : session.status === "active"
      ? {
          eyebrow: isTemplateSession
            ? session.templateName || "Treino por ficha"
            : "Treino em andamento",
          title: timer || "00:00",
          subtitle: isTemplateSession
            ? `${completedTemplateExercises}/${totalTemplateExercises} exercícios concluídos`
            : "Continue. Um exercício por vez.",
          icon: isTemplateSession ? "📋" : "🔥",
          color: T.accent,
          bg: `${T.accent}10`,
          border: `${T.accent}30`,
        }
      : {
          eyebrow: "Pronto para treinar",
          title: "Apareça hoje.",
          subtitle: "Comece simples. O importante é registrar.",
          icon: "🍑",
          color: T.accent,
          bg: T.bgCard,
          border: T.bgCardBorder,
        };

  return (
    <div>
      <div
        style={{
          borderRadius: "20px",
          marginBottom: "14px",
          border: `1px solid ${statusInfo.border}`,
          background: statusInfo.bg,
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "12px", minWidth: 0 }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "16px",
                background: `${statusInfo.color}18`,
                border: `1px solid ${statusInfo.color}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              {statusInfo.icon}
            </div>

            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  color: statusInfo.color,
                  fontSize: "10px",
                  fontWeight: 800,
                  margin: "0 0 5px",
                  fontFamily: "'DM Sans',sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "1.6px",
                }}
              >
                {statusInfo.eyebrow}
              </p>

              <p
                style={{
                  color: T.text,
                  fontSize: session.status === "active" ? "25px" : "20px",
                  fontWeight: 800,
                  margin: 0,
                  fontFamily:
                    session.status === "active"
                      ? "'DM Mono',monospace"
                      : "'DM Sans',sans-serif",
                  lineHeight: 1.1,
                  letterSpacing: session.status === "active" ? "1px" : "-0.3px",
                }}
              >
                {statusInfo.title}
              </p>

              <p
                style={{
                  color: T.textSub,
                  fontSize: "12px",
                  margin: "5px 0 0",
                  fontFamily: "'DM Sans',sans-serif",
                  lineHeight: 1.4,
                }}
              >
                {statusInfo.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            {session.status === "done" &&
              (editMode ? (
                <button
                  onClick={handleSaveEdit}
                  style={{
                    background: T.green,
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "12px",
                    padding: "9px 13px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Salvar
                </button>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  style={{
                    background: T.bgCard,
                    border: `1px solid ${T.bgCardBorder}`,
                    borderRadius: "12px",
                    color: T.textSub,
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "9px 12px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Editar
                </button>
              ))}
          </div>
        </div>
      </div>

      {isTemplateSession && totalTemplateExercises > 0 && (
        <div
          style={{
            background: T.bgCard,
            border: `1px solid ${T.bgCardBorder}`,
            borderRadius: "16px",
            padding: "14px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <p
              style={{
                color: T.text,
                fontSize: "13px",
                fontWeight: 800,
                margin: 0,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Progresso da ficha
            </p>

            <p
              style={{
                color: T.accent,
                fontSize: "12px",
                fontWeight: 800,
                margin: 0,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {completedTemplateExercises}/{totalTemplateExercises}
            </p>
          </div>

          <div
            style={{
              height: "8px",
              background: T.bgCardBorder,
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${templateProgress}%`,
                height: "100%",
                background: T.accent,
                borderRadius: "999px",
                transition: "width .3s ease",
              }}
            />
          </div>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.key} style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div>
              <p
                style={{
                  color: group.color,
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans',sans-serif",
                  margin: 0,
                }}
              >
                {group.label}
              </p>

              <p
                style={{
                  color: T.textMuted,
                  fontSize: "11px",
                  margin: "3px 0 0",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {(session[group.key] || []).length} exercícios
              </p>
            </div>

            {!readonly && (
              <button
                onClick={() => setModal(group.key)}
                style={{
                  background: T.bgCard,
                  border: `1px solid ${T.bgCardBorder}`,
                  borderRadius: "999px",
                  color: T.textSub,
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                + Máquina
              </button>
            )}
          </div>

          {(session[group.key] || []).length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: T.textMuted,
                fontSize: "12px",
                fontFamily: "'DM Sans',sans-serif",
                border: `1px dashed ${T.bgCardBorder}`,
                borderRadius: "14px",
                background: T.bgCard,
              }}
            >
              {readonly
                ? "Nenhum exercício registrado."
                : "Adicione uma máquina para começar."}
            </div>
          ) : (
            (session[group.key] || []).map((exercise) => (
              <div
                key={exercise.id}
                style={{
                  opacity: isTemplateSession && exercise.completed ? 0.72 : 1,
                }}
              >
                {isTemplateSession && (
                  <button
                    onClick={() => toggleExerciseCompleted(group.key, exercise)}
                    disabled={readonly}
                    style={{
                      width: "100%",
                      background: exercise.completed
                        ? `${T.green}14`
                        : T.bgCard,
                      border: `1px solid ${
                        exercise.completed ? `${T.green}40` : T.bgCardBorder
                      }`,
                      borderRadius: "14px",
                      padding: "10px 12px",
                      marginBottom: "8px",
                      cursor: readonly ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "8px",
                        background: exercise.completed
                          ? T.green
                          : "transparent",
                        border: `1px solid ${
                          exercise.completed ? T.green : T.bgCardBorder
                        }`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {exercise.completed ? "✓" : ""}
                    </span>

                    <span
                      style={{
                        color: exercise.completed ? T.green : T.text,
                        fontSize: "13px",
                        fontWeight: 800,
                        textAlign: "left",
                        textDecoration: exercise.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {exercise.machine}
                    </span>
                  </button>
                )}

                <ExerciseRow
                  exercise={exercise}
                  theme={T}
                  readonly={readonly}
                  onChange={(updatedExercise) =>
                    updateExercise(group.key, exercise.id, updatedExercise)
                  }
                  onDelete={() => deleteExercise(group.key, exercise.id)}
                  onShowHistory={() => setHistModal(exercise.id)}
                />
              </div>
            ))
          )}
        </div>
      ))}

      {modal && (
        <AddMachineModal
          group={modal}
          theme={T}
          onAdd={(machine) => addExercise(modal, machine)}
          onClose={() => setModal(null)}
          existingMachines={(session[modal] || []).map(
            (exercise) => exercise.machine
          )}
          allSessions={data || []}
        />
      )}

      {histExercise && (
        <HistoryModal
          machine={histExercise.machine}
          history={histExercise.weightHistory || []}
          theme={T}
          onClose={() => setHistModal(null)}
        />
      )}
    </div>
  );
}
