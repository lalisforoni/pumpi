// ── Momentum ────────────────────────────────────────────────
export const MOMENTUM_LEVELS = [
  { min: 0, label: "Momentum I", desc: "0–10 treinos" },
  { min: 11, label: "Momentum II", desc: "11–30 treinos" },
  { min: 31, label: "Momentum III", desc: "31–60 treinos" },
  { min: 61, label: "Momentum IV", desc: "61–100 treinos" },
  { min: 101, label: "Momentum V", desc: "100+ treinos" },
];

export function getMomentumLevel(totalDone) {
  return [...MOMENTUM_LEVELS]
    .reverse()
    .find((level) => totalDone >= level.min) || MOMENTUM_LEVELS[0];
}

export function getMomentumNext(totalDone) {
  return (
    MOMENTUM_LEVELS.find((level) => totalDone < level.min) ||
    MOMENTUM_LEVELS[MOMENTUM_LEVELS.length - 1]
  );
}

export function getMomentumPct(totalDone) {
  const current = getMomentumLevel(totalDone);
  const next = getMomentumNext(totalDone);

  if (next.min === current.min) return 100;

  return Math.min(
    100,
    Math.round(
      ((totalDone - current.min) / (next.min - current.min)) * 100
    )
  );
}

// ── Conquistas ───────────────────────────────────────────────
export const ACHIEVEMENTS = [
  {
    id: "first_week",
    name: "Primeira Semana",
    desc: "7 treinos registrados",
    check: (sessions) =>
      sessions.filter((session) => session.status === "done").length >= 7,
  },
  {
    id: "em_movimento",
    name: "Em Movimento",
    desc: "30 treinos concluídos",
    check: (sessions) =>
      sessions.filter((session) => session.status === "done").length >= 30,
  },
  {
    id: "sem_desculpas",
    name: "Sem Desculpas",
    desc: "28 dias de consistência",
    check: (_sessions, streak) => streak >= 28,
  },
  {
    id: "consistencia",
    name: "Consistência",
    desc: "100 treinos registrados",
    check: (sessions) =>
      sessions.filter((session) => session.status === "done").length >= 100,
  },
  {
    id: "inabalavel",
    name: "Inabalável",
    desc: "365 dias ativos",
    check: (_sessions, streak) => streak >= 365,
  },
];

// ── Streak baseado nos dias configurados pelo usuário ────────
// workoutDays: array de números: 0=domingo, 1=segunda ... 6=sábado
export function calcConsistencyStreak(doneSessions, workoutDays) {
  if (!doneSessions.length || !workoutDays.length) return 0;

  const trainedDays = new Set(
    doneSessions.map((session) => session.date.slice(0, 10))
  );

  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const dayOfWeek = day.getDay();
    const iso = day.toISOString().slice(0, 10);

    if (!workoutDays.includes(dayOfWeek)) continue;

    if (trainedDays.has(iso)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

// ── PRs — maior peso por máquina, sem repetição ──────────────
export function calcMachinePRs(allExercises) {
  const prs = {};

  allExercises.forEach((exercise) => {
    const best = Math.max(
      ...(exercise.weightHistory || []).map(
        (entry) => parseFloat(entry.weight) || 0
      ),
      0
    );

    if (best > 0 && (!prs[exercise.machine] || best > prs[exercise.machine])) {
      prs[exercise.machine] = best;
    }
  });

  return prs;
}
