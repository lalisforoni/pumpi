import { useState } from "react";
import {
  addWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlans,
  updateWorkoutPlan,
} from "../lib/storage";
import AddMachineModal from "./AddMachineModal";
import ExerciseRow from "./ExerciseRow";

export default function WorkoutPlansView({
  theme,
  sessions,
  onStartFromPlan,
}) {
  const T = theme;

  const [plans, setPlans] = useState(getWorkoutPlans());
  const [editingPlan, setEditingPlan] = useState(null);
  const [modalGroup, setModalGroup] = useState(null);

  const emptyPlan = () => ({
    id: Date.now(),
    name: "Treino A",
    description: "",
    lower: [],
    upper: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const createPlan = () => {
    const next = addWorkoutPlan(emptyPlan());
    setPlans(next);
  };

  const removePlan = (id) => {
    deleteWorkoutPlan(id);

    const refreshedPlans = getWorkoutPlans();

    setPlans(refreshedPlans);
    setEditingPlan(null);
    setModalGroup(null);
  };

  const savePlan = (plan) => {
    const next = updateWorkoutPlan(plan.id, plan);
    setPlans(next);

    const refreshed = next.find((item) => String(item.id) === String(plan.id));
    setEditingPlan(refreshed || null);
  };

  const updateExercise = (group, id, updatedExercise) => {
    const updatedPlan = {
      ...editingPlan,
      [group]: (editingPlan[group] || []).map((exercise) =>
        exercise.id === id ? { ...exercise, ...updatedExercise } : exercise
      ),
    };

    savePlan(updatedPlan);
  };

  const deleteExercise = (group, id) => {
    const updatedPlan = {
      ...editingPlan,
      [group]: (editingPlan[group] || []).filter(
        (exercise) => exercise.id !== id
      ),
    };

    savePlan(updatedPlan);
  };

  const addExercise = (group, machine) => {
    const cleanMachine = String(machine || "").trim();
    if (!cleanMachine) return;

    const allExercises = (sessions || [])
      .flatMap((session) => [
        ...(session.lower || []),
        ...(session.upper || []),
      ])
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

    const updatedPlan = {
      ...editingPlan,
      [group]: [...(editingPlan[group] || []), newExercise],
    };

    savePlan(updatedPlan);
    setModalGroup(null);
  };

  const groups = [
    { key: "lower", label: "Lower Body", color: T.green },
    { key: "upper", label: "Upper Body", color: T.blue },
  ];

  const Card = ({ children, onClick, style = {} }) => (
    <div
      onClick={onClick}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "10px",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );

  if (editingPlan) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setEditingPlan(null)}
          style={{
            background: "none",
            border: "none",
            color: T.accent,
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "16px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          ← Voltar para fichas
        </button>

        <Card>
          <input
            value={editingPlan.name}
            onChange={(event) =>
              savePlan({ ...editingPlan, name: event.target.value })
            }
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: "12px",
              color: T.text,
              fontSize: "18px",
              fontWeight: 800,
              padding: "12px",
              marginBottom: "10px",
              fontFamily: "'DM Sans',sans-serif",
              outline: "none",
            }}
          />

          <input
            value={editingPlan.description}
            placeholder="Descrição. Ex: Lower, Push, Pull..."
            onChange={(event) =>
              savePlan({ ...editingPlan, description: event.target.value })
            }
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: "12px",
              color: T.text,
              fontSize: "13px",
              padding: "12px",
              fontFamily: "'DM Sans',sans-serif",
              outline: "none",
            }}
          />
        </Card>

        {groups.map((group) => (
          <div key={group.key} style={{ marginBottom: "22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
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
                  {(editingPlan[group.key] || []).length} exercícios
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalGroup(group.key)}
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
                + Exercício
              </button>
            </div>

            {(editingPlan[group.key] || []).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "18px",
                  color: T.textMuted,
                  fontSize: "12px",
                  fontFamily: "'DM Sans',sans-serif",
                  border: `1px dashed ${T.bgCardBorder}`,
                  borderRadius: "14px",
                  background: T.bgCard,
                }}
              >
                Adicione exercícios nesta ficha.
              </div>
            ) : (
              (editingPlan[group.key] || []).map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  theme={T}
                  readonly={false}
                  onChange={(updatedExercise) =>
                    updateExercise(group.key, exercise.id, updatedExercise)
                  }
                  onDelete={() => deleteExercise(group.key, exercise.id)}
                  onShowHistory={() => {}}
                />
              ))
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => onStartFromPlan(editingPlan)}
          style={{
            width: "100%",
            background: T.accent,
            border: "none",
            borderRadius: "16px",
            color: T.accentText,
            fontWeight: 800,
            fontSize: "13px",
            padding: "15px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "10px",
          }}
        >
          Iniciar treino com esta ficha
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            removePlan(editingPlan.id);
          }}
          style={{
            width: "100%",
            background: "transparent",
            border: `1px solid ${T.danger}30`,
            borderRadius: "14px",
            color: T.danger,
            fontWeight: 700,
            fontSize: "13px",
            padding: "13px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Excluir ficha
        </button>

        {modalGroup && (
          <AddMachineModal
            group={modalGroup}
            theme={T}
            onAdd={(machine) => addExercise(modalGroup, machine)}
            onClose={() => setModalGroup(null)}
            existingMachines={(editingPlan[modalGroup] || []).map(
              (exercise) => exercise.machine
            )}
            allSessions={sessions || []}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <Card>
        <p
          style={{
            color: T.text,
            fontSize: "18px",
            fontWeight: 800,
            margin: "0 0 6px",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Fichas de treino
        </p>

        <p
          style={{
            color: T.textSub,
            fontSize: "13px",
            lineHeight: 1.5,
            margin: "0 0 14px",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Crie treinos A/B/C e comece uma sessão com os exercícios já carregados.
        </p>

        <button
          type="button"
          onClick={createPlan}
          style={{
            width: "100%",
            background: T.accent,
            border: "none",
            borderRadius: "14px",
            color: T.accentText,
            fontWeight: 800,
            fontSize: "13px",
            padding: "14px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Criar nova ficha
        </button>
      </Card>

      {plans.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <p style={{ fontSize: "42px", marginBottom: "12px" }}>📋</p>

          <p
            style={{
              color: T.textSub,
              fontSize: "14px",
              lineHeight: 1.6,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Nenhuma ficha criada ainda.
            <br />
            Crie seu Treino A, B ou C.
          </p>
        </div>
      ) : (
        plans.map((plan) => {
          const total =
            (plan.lower?.length || 0) + (plan.upper?.length || 0);

          return (
            <Card key={plan.id} onClick={() => setEditingPlan(plan)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p
                    style={{
                      color: T.text,
                      fontSize: "15px",
                      fontWeight: 800,
                      margin: "0 0 4px",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {plan.name}
                  </p>

                  <p
                    style={{
                      color: T.textSub,
                      fontSize: "12px",
                      margin: 0,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {plan.description || "Sem descrição"} · {total} exercícios
                  </p>
                </div>

                <span
                  style={{
                    color: T.textMuted,
                    fontSize: "18px",
                    lineHeight: 1,
                  }}
                >
                  ›
                </span>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
