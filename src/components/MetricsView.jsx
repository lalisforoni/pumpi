import { useState } from "react";
import { getPersona } from "../lib/personas";
import {
  calcMachinePRs,
  calcConsistencyStreak,
  calcWeeklyProgress,
  ACHIEVEMENTS,
  getLevel,
  getNextLevel,
  getLevelPct,
} from "../lib/gamification";
import { getWorkoutDays, saveWorkoutDays } from "../lib/storage";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function MetricsView({ sessions, theme }) {
  const T = theme;
  const [workoutDays, setWorkoutDaysState] = useState(getWorkoutDays());
  const [showDayPicker, setShowDayPicker] = useState(false);

  const doneSessions = sessions.filter((s) => s.status === "done");

  const allExercises = sessions.flatMap((s) => [
    ...(s.lower || []).map((e) => ({ ...e, group: "lower", date: s.date })),
    ...(s.upper || []).map((e) => ({ ...e, group: "upper", date: s.date })),
  ]);

  const totalLower = sessions.reduce((a, s) => a + (s.lower?.length || 0), 0);
  const totalUpper = sessions.reduce((a, s) => a + (s.upper?.length || 0), 0);
  const totalDone = doneSessions.length;

  const durations = doneSessions
    .filter((s) => s.startedAt && s.finishedAt)
    .map((s) => Math.floor((s.finishedAt - s.startedAt) / 60000));

  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const avgDur = durations.length
    ? Math.round(totalMinutes / durations.length)
    : 0;

  const totalKgLifted = allExercises.reduce((acc, ex) => {
    const weight = parseFloat(ex.weight) || 0;
    const series = parseFloat(ex.series) || 1;
    return acc + weight * series;
  }, 0);

  const streak = calcConsistencyStreak(doneSessions, workoutDays);
  const weekly = calcWeeklyProgress(doneSessions, workoutDays);

  const sessionDays = [
    ...new Set(doneSessions.map((s) => s.date.slice(0, 10))),
  ].sort();

  let bestStreak = 0;
  let cur = 0;

  for (let i = 0; i < sessionDays.length; i++) {
    if (i === 0) {
      cur = 1;
    } else {
      const diff =
        (new Date(sessionDays[i]) - new Date(sessionDays[i - 1])) /
        (1000 * 60 * 60 * 24);

      cur = diff === 1 ? cur + 1 : 1;
    }

    if (cur > bestStreak) bestStreak = cur;
  }

  const lowerPct =
    totalLower + totalUpper > 0
      ? Math.round((totalLower / (totalLower + totalUpper)) * 100)
      : 50;

  const upperPct = 100 - lowerPct;

  const machinePRs = calcMachinePRs(allExercises);

  const machineCount = {};
  allExercises.forEach((exercise) => {
    machineCount[exercise.machine] =
      (machineCount[exercise.machine] || 0) + 1;
  });

  const topMachines = Object.entries(machineCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const level = getLevel(totalDone);
  const nextLevel = getNextLevel(totalDone);
  const levelPct = getLevelPct(totalDone);

  const earnedAchievements = ACHIEVEMENTS.filter((a) =>
    a.check(sessions, streak)
  );

  const pendingAchievements = ACHIEVEMENTS.filter(
    (a) => !a.check(sessions, streak)
  );

  const toggleDay = (dow) => {
    const next = workoutDays.includes(dow)
      ? workoutDays.filter((d) => d !== dow)
      : [...workoutDays, dow].sort();

    setWorkoutDaysState(next);
    saveWorkoutDays(next);
  };

  const Bar = ({ pct, color, h = 8 }) => (
    <div
      style={{
        background: T.bgCard,
        borderRadius: "99px",
        height: `${h}px`,
        overflow: "hidden",
        border: `1px solid ${T.bgCardBorder}`,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, pct)}%`,
          background: color,
          borderRadius: "99px",
          transition: "width .6s ease",
        }}
      />
    </div>
  );

  const Card = ({ children, style = {} }) => (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "12px",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <p
      style={{
        color: T.textMuted,
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "2px",
        textTransform: "uppercase",
        fontFamily: "'DM Sans',sans-serif",
        margin: "0 0 8px",
      }}
    >
      {children}
    </p>
  );

  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
        <p
          style={{
            color: T.textSub,
            fontSize: "14px",
            lineHeight: 1.7,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Faça pelo menos um treino
          <br />
          para ver suas métricas!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {[
          { label: "Treinos", value: totalDone, sub: `${sessions.length} total` },
          { label: "Horas", value: `${totalHours}h`, sub: `média ${avgDur}min` },
          {
            label: "Sequência",
            value: streak,
            sub: `${workoutDays.length} dias/sem`,
          },
        ].map((item, index) => (
          <div
            key={index}
            style={{
              background: T.bgCard,
              border: `1px solid ${T.bgCardBorder}`,
              borderRadius: "14px",
              padding: "14px 10px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: T.accent,
                fontSize: "22px",
                fontWeight: 800,
                margin: 0,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {item.value}
            </p>
            <p
              style={{
                color: T.text,
                fontSize: "11px",
                fontWeight: 600,
                margin: "4px 0 2px",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                color: T.textMuted,
                fontSize: "10px",
                margin: 0,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <SectionLabel>Nível</SectionLabel>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "10px",
          }}
        >
          <div>
            <p
              style={{
                color: T.text,
                fontSize: "22px",
                fontWeight: 800,
                margin: 0,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {level.label}
            </p>
            <p
              style={{
                color: T.textMuted,
                fontSize: "11px",
                margin: "3px 0 0",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {level.desc}
            </p>
          </div>

          <span style={{ color: T.accent, fontSize: "22px" }}>🍑</span>
        </div>

        <Bar pct={levelPct} color={T.accent} h={8} />

        <p
          style={{
            color: T.textMuted,
            fontSize: "11px",
            margin: "8px 0 0",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Próximo nível: {nextLevel.label}
        </p>
      </Card>

      <Card>
        <SectionLabel>Meta semanal</SectionLabel>

        <div style={{ display: "flex", gap: "7px", marginBottom: "10px" }}>
          {Array.from({ length: weekly.target }).map((_, index) => (
            <span
              key={index}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: index < weekly.done ? T.accent : T.bgCardBorder,
                display: "inline-block",
              }}
            />
          ))}
        </div>

        <p
          style={{
            color: T.text,
            fontSize: "18px",
            fontWeight: 800,
            margin: 0,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {weekly.done} de {weekly.target} treinos
        </p>

        <p
          style={{
            color: T.textMuted,
            fontSize: "11px",
            margin: "4px 0 0",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Sua consistência da semana
        </p>
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <SectionLabel>Consistência</SectionLabel>

          <button
            onClick={() => setShowDayPicker(!showDayPicker)}
            style={{
              background: T.bgCard,
              border: `1px solid ${T.bgCardBorder}`,
              borderRadius: "8px",
              color: T.textSub,
              fontSize: "11px",
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {showDayPicker ? "Fechar" : "Configurar dias"}
          </button>
        </div>

        {showDayPicker && (
          <div style={{ marginBottom: "14px" }}>
            <p
              style={{
                color: T.textMuted,
                fontSize: "11px",
                marginBottom: "8px",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Quais são seus dias de treino?
            </p>

            <div style={{ display: "flex", gap: "6px" }}>
              {DAY_LABELS.map((label, dow) => (
                <button
                  key={dow}
                  onClick={() => toggleDay(dow)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: "8px",
                    border: `1px solid ${
                      workoutDays.includes(dow)
                        ? T.accent
                        : T.bgCardBorder
                    }`,
                    background: workoutDays.includes(dow)
                      ? T.accent
                      : "transparent",
                    color: workoutDays.includes(dow)
                      ? T.accentText
                      : T.textMuted,
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <p
            style={{
              color: T.text,
              fontSize: "28px",
              fontWeight: 800,
              margin: 0,
              fontFamily: "'DM Mono',monospace",
              letterSpacing: "-1px",
            }}
          >
            {streak}
          </p>

          <p
            style={{
              color: T.textSub,
              fontSize: "13px",
              margin: 0,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            dias seguidos
          </p>

          <p
            style={{
              color: T.textMuted,
              fontSize: "11px",
              margin: "0 0 0 auto",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            melhor: {bestStreak}
          </p>
        </div>

        <Bar pct={Math.min(100, (streak / 30) * 100)} color={T.accent} h={6} />
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <SectionLabel>Upper vs Lower</SectionLabel>

          <div style={{ display: "flex", gap: "6px" }}>
            <span
              style={{
                background: `${T.green}20`,
                color: T.green,
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "20px",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              🦵 {lowerPct}%
            </span>
            <span
              style={{
                background: `${T.blue}20`,
                color: T.blue,
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "20px",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              💪 {upperPct}%
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "4px",
            height: "24px",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: lowerPct,
              background: T.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {lowerPct > 15 ? "Lower" : ""}
            </span>
          </div>

          <div
            style={{
              flex: upperPct,
              background: T.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {upperPct > 15 ? "Upper" : ""}
            </span>
          </div>
        </div>
      </Card>

      {totalKgLifted > 0 && (
        <Card>
          <SectionLabel>Força Total</SectionLabel>

          <p
            style={{
              color: T.accent,
              fontSize: "28px",
              fontWeight: 800,
              margin: "0 0 2px",
              fontFamily: "'DM Mono',monospace",
              letterSpacing: "-1px",
            }}
          >
            {totalKgLifted.toLocaleString("pt-BR")} kg
          </p>

          <p
            style={{
              color: T.textMuted,
              fontSize: "11px",
              margin: 0,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            total acumulado movimentado
          </p>
        </Card>
      )}

      {topMachines.length > 0 && (
        <Card>
          <SectionLabel>Suas Favoritas</SectionLabel>

          {topMachines.map(([name, count], i) => {
            const persona = getPersona(name);
            const pct = Math.round((count / topMachines[0][1]) * 100);

            return (
              <div key={name} style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{persona.emoji}</span>
                    <span
                      style={{
                        color: T.text,
                        fontSize: "12px",
                        fontWeight: 500,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      {persona.name}
                    </span>

                    {i === 0 && (
                      <span
                        style={{
                          background: `${T.accent}20`,
                          color: T.accent,
                          fontSize: "9px",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        favorita
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      color: T.textSub,
                      fontSize: "11px",
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {count}x
                  </span>
                </div>

                <Bar pct={pct} color={persona.color} h={5} />
              </div>
            );
          })}
        </Card>
      )}

      {Object.keys(machinePRs).length > 0 && (
        <Card>
          <SectionLabel>Meus PRs</SectionLabel>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {Object.entries(machinePRs)
              .sort((a, b) => b[1] - a[1])
              .map(([name, kg]) => {
                const persona = getPersona(name);

                return (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: `${persona.color}10`,
                      border: `1px solid ${persona.color}25`,
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>{persona.emoji}</span>
                      <span
                        style={{
                          color: T.text,
                          fontSize: "12px",
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        {name}
                      </span>
                    </div>

                    <span
                      style={{
                        color: persona.color,
                        fontSize: "14px",
                        fontWeight: 700,
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {kg}kg
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {(earnedAchievements.length > 0 || pendingAchievements.length > 0) && (
        <Card>
          <SectionLabel>Conquistas</SectionLabel>

          {earnedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderBottom: `1px solid ${T.divider}`,
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: `${T.accent}15`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                  color: T.accent,
                  fontWeight: 800,
                }}
              >
                ✓
              </div>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: T.text,
                    fontSize: "13px",
                    fontWeight: 700,
                    margin: 0,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {achievement.name}
                </p>
                <p
                  style={{
                    color: T.textMuted,
                    fontSize: "11px",
                    margin: "2px 0 0",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {achievement.desc}
                </p>
              </div>

              <span
                style={{
                  background: `${T.green}15`,
                  color: T.green,
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "20px",
                  fontFamily: "'DM Sans',sans-serif",
                  flexShrink: 0,
                }}
              >
                conquistado
              </span>
            </div>
          ))}

          {pendingAchievements.slice(0, 3).map((achievement) => (
            <div
              key={achievement.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderBottom: `1px solid ${T.divider}`,
                opacity: 0.5,
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: T.bgCard,
                  border: `1px solid ${T.bgCardBorder}`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                }}
              >
                ○
              </div>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: T.text,
                    fontSize: "13px",
                    fontWeight: 700,
                    margin: 0,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {achievement.name}
                </p>
                <p
                  style={{
                    color: T.textMuted,
                    fontSize: "11px",
                    margin: "2px 0 0",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {achievement.desc}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {avgDur > 0 && (
        <Card>
          <SectionLabel>Tempo Médio</SectionLabel>

          <p
            style={{
              color: T.text,
              fontSize: "22px",
              fontWeight: 800,
              margin: 0,
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {avgDur >= 60
              ? `${Math.floor(avgDur / 60)}h ${avgDur % 60}min`
              : `${avgDur}min`}
          </p>

          <p
            style={{
              color: T.textMuted,
              fontSize: "11px",
              margin: "4px 0 0",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            por treino
          </p>
        </Card>
      )}
    </div>
  );
}
