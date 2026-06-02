import { useState } from "react";
import { calcDuration, calcMinutes } from "../lib/utils";
import { calcWorkoutVolume } from "../lib/gamification";

export default function CelebrationModal({ theme, session, onClose }) {
  const T = theme;
  const [showDetails] = useState(true);

  const totalExercises =
    (session.lower?.length || 0) + (session.upper?.length || 0);

  const duration = calcDuration(session.startedAt, session.finishedAt);
  const minutes = calcMinutes(session.startedAt, session.finishedAt);
  const volume = calcWorkoutVolume(session);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(31,31,31,0.72)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
        padding: "22px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "340px",
          background: T.modalBg,
          border: `1px solid ${T.bgCardBorder}`,
          borderRadius: "28px",
          padding: "30px 24px 24px",
          boxShadow: `0 24px 80px rgba(31,31,31,0.28)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "74px",
            height: "74px",
            borderRadius: "24px",
            background: `${T.accent}18`,
            border: `1px solid ${T.accent}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            fontSize: "36px",
          }}
        >
          🍑
        </div>

        <p
          style={{
            color: T.textMuted,
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontFamily: "'DM Sans',sans-serif",
            margin: "0 0 8px",
          }}
        >
          Treino concluído
        </p>

        <h2
          style={{
            color: T.text,
            fontSize: "26px",
            fontWeight: 800,
            lineHeight: 1.05,
            fontFamily: "'DM Sans',sans-serif",
            margin: "0 0 10px",
          }}
        >
          Pump entregue.
        </h2>

        <p
          style={{
            color: T.textSub,
            fontSize: "13px",
            lineHeight: 1.5,
            fontFamily: "'DM Sans',sans-serif",
            margin: "0 0 22px",
          }}
        >
          Você ficou mais forte hoje.
        </p>

        {showDetails && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            <MetricBox label="treino" value="+1" theme={T} />
            <MetricBox
              label="tempo"
              value={minutes > 0 ? `+${minutes}min` : duration || "—"}
              theme={T}
            />
            <MetricBox
              label="exercícios"
              value={`+${totalExercises}`}
              theme={T}
            />
            <MetricBox
              label="kg movidos"
              value={volume > 0 ? `+${Math.round(volume)}kg` : "—"}
              theme={T}
            />
          </div>
        )}

        <div
          style={{
            background: T.bgCard,
            border: `1px solid ${T.bgCardBorder}`,
            borderRadius: "16px",
            padding: "12px",
            marginBottom: "18px",
          }}
        >
          <p
            style={{
              color: T.textMuted,
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              margin: "0 0 8px",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Registrado
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              justifyContent: "center",
            }}
          >
            {[...(session.lower || []), ...(session.upper || [])]
              .slice(0, 6)
              .map((exercise, index) => (
                <span
                  key={`${exercise.machine}-${index}`}
                  style={{
                    background: `${T.accent}12`,
                    border: `1px solid ${T.accent}22`,
                    borderRadius: "999px",
                    padding: "5px 9px",
                    color: T.textSub,
                    fontSize: "10px",
                    fontWeight: 600,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {exercise.machine}
                  {exercise.weight ? ` · ${exercise.weight}kg` : ""}
                </span>
              ))}

            {totalExercises > 6 && (
              <span
                style={{
                  color: T.textMuted,
                  fontSize: "10px",
                  padding: "5px 2px",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                +{totalExercises - 6} mais
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: T.accent,
            border: "none",
            borderRadius: "16px",
            color: T.accentText,
            fontWeight: 800,
            fontSize: "14px",
            padding: "15px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

function MetricBox({ label, value, theme }) {
  return (
    <div
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.bgCardBorder}`,
        borderRadius: "14px",
        padding: "12px 8px",
      }}
    >
      <p
        style={{
          color: theme.accent,
          fontSize: "18px",
          fontWeight: 800,
          margin: 0,
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {value}
      </p>

      <p
        style={{
          color: theme.textMuted,
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "1px",
          textTransform: "uppercase",
          margin: "4px 0 0",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {label}
      </p>
    </div>
  );
}
