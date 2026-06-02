import { useEffect, useState } from "react";
import { repOptions } from "../lib/personas";

export default function ExerciseRow({
  exercise,
  onChange,
  onDelete,
  onShowHistory,
  theme,
  readonly,
}) {
  const [localWeight, setLocalWeight] = useState(exercise.weight || "");

  const history = exercise.weightHistory || [];
  const hasHistory = history.length > 0;
  const last = hasHistory ? history[history.length - 1] : null;

  useEffect(() => {
    setLocalWeight(exercise.weight || "");
  }, [exercise.id, exercise.weight]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });

  const handleWeightChange = (value) => {
    setLocalWeight(value);
    onChange({ ...exercise, weight: value });
  };

  const handleWeightBlur = (value) => {
    const lastWeight = history[history.length - 1]?.weight || "";

    if (value && value !== lastWeight) {
      const entry = {
        weight: value,
        reps: exercise.reps,
        rp: exercise.rp,
        series: exercise.series,
        date: new Date().toISOString(),
      };

      onChange({
        ...exercise,
        weight: value,
        weightHistory: [...history, entry],
      });
    }
  };

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "7px",
    fontSize: "13px",
    padding: "6px 5px",
    width: "100%",
    textAlign: "center",
    fontFamily: "'DM Mono',monospace",
    outline: "none",
  };

  return (
    <div
      style={{
        padding: "10px",
        background: theme.bgCard,
        borderRadius: "12px",
        border: `1px solid ${theme.bgCardBorder}`,
        marginBottom: "8px",
        opacity: readonly ? 0.72 : 1,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 70px 50px 70px 55px 36px",
          gap: "5px",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              color: theme.text,
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {exercise.machine}
          </span>

          {last && (
            <p
              style={{
                color: theme.textMuted,
                fontSize: "10px",
                margin: "2px 0 0",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              atualizado {formatDate(last.date)}
            </p>
          )}
        </div>

        <input
          type="text"
          placeholder="kg"
          value={localWeight}
          disabled={readonly}
          onChange={(e) => !readonly && handleWeightChange(e.target.value)}
          onBlur={(e) => !readonly && handleWeightBlur(e.target.value)}
          style={{
            ...inputStyle,
            color: theme.accent,
          }}
        />

        <input
          type="number"
          placeholder="Sér"
          value={exercise.series || ""}
          disabled={readonly}
          onChange={(e) =>
            !readonly &&
            onChange({
              ...exercise,
              series: e.target.value,
            })
          }
          style={{
            ...inputStyle,
            color: theme.green,
          }}
        />

        <select
          value={exercise.reps || ""}
          disabled={readonly}
          onChange={(e) =>
            !readonly &&
            onChange({
              ...exercise,
              reps: e.target.value,
            })
          }
          style={{
            ...inputStyle,
            color: theme.blue,
            fontSize: "11px",
          }}
        >
          <option value="">rep</option>
          {repOptions.map((rep) => (
            <option key={rep} value={rep}>
              {rep}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="RP"
          value={exercise.rp || ""}
          disabled={readonly}
          onChange={(e) =>
            !readonly &&
            onChange({
              ...exercise,
              rp: e.target.value,
            })
          }
          style={{
            ...inputStyle,
            color: theme.green,
          }}
        />

        <button
          onClick={onDelete}
          disabled={readonly}
          style={{
            background: "rgba(255,80,80,0.1)",
            border: "1px solid rgba(255,80,80,0.2)",
            borderRadius: "7px",
            color: "#ff6b6b",
            fontSize: "15px",
            cursor: readonly ? "default" : "pointer",
            padding: "4px 0",
            width: "36px",
            opacity: readonly ? 0.4 : 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 70px 50px 70px 55px 36px",
          gap: "5px",
          padding: "3px 0 0",
        }}
      >
        {["", "Peso", "Sér", "Reps", "RP", ""].map((header, index) => (
          <span
            key={index}
            style={{
              color: theme.textMuted,
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              textAlign: "center",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {header}
          </span>
        ))}
      </div>

      <button
        onClick={onShowHistory}
        style={{
          marginTop: "8px",
          width: "100%",
          background: hasHistory ? `${theme.accent}10` : "transparent",
          border: hasHistory
            ? `1px solid ${theme.accent}25`
            : `1px solid ${theme.bgCardBorder}`,
          borderRadius: "8px",
          padding: "6px",
          color: hasHistory ? theme.accent : theme.textMuted,
          fontSize: "11px",
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        📈{" "}
        {hasHistory
          ? `Ver evolução · ${history.length} registros`
          : "Sem histórico ainda"}
      </button>
    </div>
  );
}
