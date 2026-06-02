import { useState } from "react";
import { getPersona } from "../lib/personas";
import { calcMachinePRs, calcConsistencyStreak, ACHIEVEMENTS, getMomentumLevel, getMomentumNext, getMomentumPct } from "../lib/gamification";
import { getWorkoutDays, saveWorkoutDays } from "../lib/storage";

const DAY_LABELS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default function MetricsView({ sessions, theme }) {
  const T = theme;
  const [workoutDays, setWorkoutDaysState] = useState(getWorkoutDays());
  const [showDayPicker, setShowDayPicker] = useState(false);

  const doneSessions = sessions.filter(s => s.status === "done");
  const allExercises = sessions.flatMap(s => [
    ...(s.lower || []).map(e => ({ ...e, group: "lower", date: s.date })),
    ...(s.upper || []).map(e => ({ ...e, group: "upper", date: s.date })),
  ]);

  const totalLower = sessions.reduce((a, s) => a + (s.lower?.length || 0), 0);
  const totalUpper = sessions.reduce((a, s) => a + (s.upper?.length || 0), 0);
  const totalDone = doneSessions.length;
  const totalKgLifted = allExercises.reduce((acc, ex) =>
    acc + (ex.weightHistory || []).reduce((a, h) => a + (parseFloat(h.weight) || 0), 0), 0);

  // Streak baseado nos dias configurados
  const streak = calcConsistencyStreak(doneSessions, workoutDays);

  // Melhor streak (dias corridos para referência)
  const sessionDays = [...new Set(doneSessions.map(s => s.date.slice(0, 10)))].sort();
  let bestStreak = 0, cur = 0;
  for (let i = 0; i < sessionDays.length; i++) {
    cur = i === 0 ? 1 : (() => {
      const d = (new Date(sessionDays[i]) - new Date(sessionDays[i - 1])) / (1000 * 60 * 60 * 24);
      return d === 1 ? cur + 1 : 1;
    })();
    if (cur > bestStreak) bestStreak = cur;
  }

  const durations = doneSessions.filter(s => s.startedAt && s.finishedAt).map(s => Math.floor((s.finishedAt - s.startedAt) / 60000));
  const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const totalHours = Math.floor(durations.reduce((a, b) => a + b, 0) / 60);

  const lowerPct = (totalLower + totalUpper) > 0 ? Math.round(totalLower / (totalLower + totalUpper) * 100) : 50;
  const upperPct = 100 - lowerPct;

  // PRs sem repetição
  const machinePRs = calcMachinePRs(allExercises);

  const machineCount = {};
  allExercises.forEach(e => { machineCount[e.machine] = (machineCount[e.machine] || 0) + 1; });
  const topMachines = Object.entries(machineCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Momentum
  const momentum = getMomentumLevel(totalDone);
  const momentumNext = getMomentumNext(totalDone);
  const momentumPct = getMomentumPct(totalDone);

  // Conquistas
  const earnedAchievements = ACHIEVEMENTS.filter(a => a.check(sessions, streak));
  const pendingAchievements = ACHIEVEMENTS.filter(a => !a.check(sessions, streak));

  const toggleDay = (dow) => {
    const next = workoutDays.includes(dow)
      ? workoutDays.filter(d => d !== dow)
      : [...workoutDays, dow].sort();
    setWorkoutDaysState(next);
    saveWorkoutDays(next);
  };

  const Bar = ({ pct, color, h = 8 }) => (
    <div style={{ background: T.bgCard, borderRadius: "99px", height: `${h}px`, overflow: "hidden", border: `1px solid ${T.bgCardBorder}` }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: "99px", transition: "width .6s ease" }} />
    </div>
  );

  const Card = ({ children, style = {} }) => (
    <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "16px", padding: "16px", marginBottom: "12px", ...style }}>
      {children}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <p style={{ color: T.textMuted, fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", margin: "0 0 8px" }}>
      {children}
    </p>
  );

  if (sessions.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
      <p style={{ color: T.textSub, fontSize: "14px", lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif" }}>Faça pelo menos um treino<br />para ver suas métricas!</p>
    </div>
  );

  return (
    <div>
      {/* Stats rápidos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        {[
          { label: "Treinos", value: totalDone, sub: `${sessions.length} total` },
          { label: "Horas", value: `${totalHours}h`, sub: `média ${avgDur}min` },
          { label: "Sequência", value: `${streak}`, sub: `${workoutDays.length} dias/sem` },
        ].map((s, i) => (
          <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "14px", padding: "14px 10px", textAlign: "center" }}>
            <p style={{ color: T.accent, fontSize: "22px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace" }}>{s.value}</p>
            <p style={{ color: T.text, fontSize: "11px", fontWeight: 600, margin: "4px 0 2px", fontFamily: "'DM Sans',sans-serif" }}>{s.label}</p>
            <p style={{ color: T.textMuted, fontSize: "10px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Consistência */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <SectionLabel>Consistência</SectionLabel>
          <button onClick={() => setShowDayPicker(!showDayPicker)}
            style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "8px", color: T.textSub, fontSize: "11px", padding: "4px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {showDayPicker ? "Fechar" : "Configurar dias"}
          </button>
        </div>

        {showDayPicker && (
          <div style={{ marginBottom: "14px" }}>
            <p style={{ color: T.textMuted, fontSize: "11px", marginBottom: "8px", fontFamily: "'DM Sans',sans-serif" }}>Quais são seus dias de treino?</p>
            <div style={{ display: "flex", gap: "6px" }}>
              {DAY_LABELS.map((label, dow) => (
                <button key={dow} onClick={() => toggleDay(dow)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: "8px", border: `1px solid ${workoutDays.includes(dow) ? T.accent : T.bgCardBorder}`, background: workoutDays.includes(dow) ? T.accent : "transparent", color: workoutDays.includes(dow) ? T.accentText : T.textMuted, fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
          <p style={{ color: T.text, fontSize: "28px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace", letterSpacing: "-1px" }}>{streak}</p>
          <p style={{ color: T.textSub, fontSize: "13px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>dias seguidos</p>
          <p style={{ color: T.textMuted, fontSize: "11px", margin: "0 0 0 auto", fontFamily: "'DM Sans',sans-serif" }}>melhor: {bestStreak}</p>
        </div>
        <Bar pct={Math.min(100, (streak / 30) * 100)} color={T.accent} h={6} />
      </Card>

      {/* Upper vs Lower */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <SectionLabel>Upper vs Lower</SectionLabel>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ background: `${T.green}20`, color: T.green, fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", fontFamily: "'DM Sans',sans-serif" }}>🦵 {lowerPct}%</span>
            <span style={{ background: `${T.blue}20`, color: T.blue, fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", fontFamily: "'DM Sans',sans-serif" }}>💪 {upperPct}%</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", height: "24px", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ flex: lowerPct, background: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>{lowerPct > 15 ? "Lower" : ""}</span>
          </div>
          <div style={{ flex: upperPct, background: T.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>{upperPct > 15 ? "Upper" : ""}</span>
          </div>
        </div>
      </Card>

      {/* Kg total */}
      {totalKgLifted > 0 && (
        <Card>
          <SectionLabel>Força Total</SectionLabel>
          <p style={{ color: T.accent, fontSize: "28px", fontWeight: 800, margin: "0 0 2px", fontFamily: "'DM Mono',monospace", letterSpacing: "-1px" }}>
            {totalKgLifted.toLocaleString("pt-BR")} kg
          </p>
          <p style={{ color: T.textMuted, fontSize: "11px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>total acumulado movimentado</p>
        </Card>
      )}

      {/* Suas favoritas */}
      {topMachines.length > 0 && (
        <Card>
          <SectionLabel>Suas Favoritas</SectionLabel>
          {topMachines.map(([name, count], i) => {
            const p = getPersona(name);
            const pct = Math.round((count / topMachines[0][1]) * 100);
            return (
              <div key={name} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px" }}>{p.emoji}</span>
                    <span style={{ color: T.text, fontSize: "12px", fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>{p.name}</span>
                    {i === 0 && <span style={{ background: `${T.accent}20`, color: T.accent, fontSize: "9px", padding: "1px 6px", borderRadius: "10px", fontFamily: "'DM Sans',sans-serif" }}>favorita</span>}
                  </div>
                  <span style={{ color: T.textSub, fontSize: "11px", fontFamily: "'DM Mono',monospace" }}>{count}x</span>
                </div>
                <Bar pct={pct} color={p.color} h={5} />
              </div>
            );
          })}
        </Card>
      )}

      {/* PRs — sem repetição, maior peso por máquina */}
      {Object.keys(machinePRs).length > 0 && (
        <Card>
          <SectionLabel>Meus PRs</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {Object.entries(machinePRs).sort((a, b) => b[1] - a[1]).map(([name, kg]) => {
              const p = getPersona(name);
              return (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: `${p.color}10`, border: `1px solid ${p.color}25`, borderRadius: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px" }}>{p.emoji}</span>
                    <span style={{ color: T.text, fontSize: "12px", fontFamily: "'DM Sans',sans-serif" }}>{name}</span>
                  </div>
                  <span style={{ color: p.color, fontSize: "14px", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{kg}kg</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Conquistas */}
      {(earnedAchievements.length > 0 || pendingAchievements.length > 0) && (
        <Card>
          <SectionLabel>Conquistas</SectionLabel>
          {earnedAchievements.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: `1px solid ${T.divider}` }}>
              <div style={{ width: "36px", height: "36px", background: `${T.accent}15`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>✓</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: T.text, fontSize: "13px", fontWeight: 700, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{a.name}</p>
                <p style={{ color: T.textMuted, fontSize: "11px", margin: "2px 0 0", fontFamily: "'DM Sans',sans-serif" }}>{a.desc}</p>
              </div>
              <span style={{ background: `${T.green}15`, color: T.green, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>conquistado</span>
            </div>
          ))}
          {pendingAchievements.slice(0, 3).map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: `1px solid ${T.divider}`, opacity: 0.5 }}>
              <div style={{ width: "36px", height: "36px", background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>○</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: T.text, fontSize: "13px", fontWeight: 700, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{a.name}</p>
                <p style={{ color: T.textMuted, fontSize: "11px", margin: "2px 0 0", fontFamily: "'DM Sans',sans-serif" }}>{a.desc}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {avgDur > 0 && (
        <Card>
          <SectionLabel>Tempo Médio</SectionLabel>
          <p style={{ color: T.text, fontSize: "22px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace" }}>
            {avgDur >= 60 ? `${Math.floor(avgDur / 60)}h ${avgDur % 60}min` : `${avgDur}min`}
          </p>
          <p style={{ color: T.textMuted, fontSize: "11px", margin: "4px 0 0", fontFamily: "'DM Sans',sans-serif" }}>por treino</p>
        </Card>
      )}
    </div>
  );
}
