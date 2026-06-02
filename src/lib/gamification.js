// ── Momentum ────────────────────────────────────────────────
export const MOMENTUM_LEVELS = [
  { min: 0,   label: "Momentum I",   desc: "0–10 treinos" },
  { min: 11,  label: "Momentum II",  desc: "11–30 treinos" },
  { min: 31,  label: "Momentum III", desc: "31–60 treinos" },
  { min: 61,  label: "Momentum IV",  desc: "61–100 treinos" },
  { min: 101, label: "Momentum V",   desc: "100+ treinos" },
];

export function getMomentumLevel(totalDone) {
  return [...MOMENTUM_LEVELS].reverse().find(l => totalDone >= l.min) || MOMENTUM_LEVELS[0];
}

export function getMomentumNext(totalDone) {
  return MOMENTUM_LEVELS.find(l => totalDone < l.min) || MOMENTUM_LEVELS[MOMENTUM_LEVELS.length - 1];
}

export function getMomentumPct(totalDone) {
  const next = getMomentumNext(totalDone);
  const current = getMomentumLevel(totalDone);
  if (next.min === current.min) return 100;
  return Math.min(100, Math.round(((totalDone - current.min) / (next.min - current.min)) * 100));
}

// ── Conquistas ───────────────────────────────────────────────
export const ACHIEVEMENTS = [
  {
    id: "first_week",
    name: "Primeira Semana",
    desc: "7 treinos registrados",
    check: (sessions) => sessions.filter(s => s.status === "done").length >= 7,
  },
  {
    id: "em_movimento",
    name: "Em Movimento",
    desc: "30 treinos concluídos",
    check: (sessions) => sessions.filter(s => s.status === "done").length >= 30,
  },
  {
    id: "sem_desculpas",
    name: "Sem Desculpas",
    desc: "28 dias de consistência",
    check: (sessions, streak) => streak >= 28,
  },
  {
    id: "consistencia",
    name: "Consistência",
    desc: "100 treinos registrados",
    check: (sessions) => sessions.filter(s => s.status === "done").length >= 100,
  },
  {
    id: "inabalavel",
    name: "Inabalável",
    desc: "365 dias ativos",
    check: (sessions, streak) => streak >= 365,
  },
];

// ── Streak baseado nos dias configurados pelo usuário ─────────
// workoutDays: array de números 0=dom, 1=seg ... 6=sáb
export function calcConsistencyStreak(doneSessions, workoutDays) {
  if (!doneSessions.length || !workoutDays.length) return 0;

  const trainedDays = new Set(doneSessions.map(s => s.date.slice(0, 10)));
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);

    if (!workoutDays.includes(dow)) continue; // não é dia de treino, pula
    if (trainedDays.has(iso)) streak++;
    else if (i > 0) break; // quebrou a sequência
  }

  return streak;
}

// ── PRs — maior peso por máquina, sem repetição ──────────────
export function calcMachinePRs(allExercises) {
  const prs = {};
  allExercises.forEach(ex => {
    const best = Math.max(...(ex.weightHistory || []).map(h => parseFloat(h.weight) || 0), 0);
    if (best > 0) {
      if (!prs[ex.machine] || best > prs[ex.machine]) {
        prs[ex.machine] = best;
      }
    }
  });
  return prs;
}
