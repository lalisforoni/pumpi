export const LEVELS = [
  { min: 1, label: "Peach Seed", desc: "1–10 treinos" },
  { min: 11, label: "Peach Grow", desc: "11–50 treinos" },
  { min: 51, label: "Peach Strong", desc: "51–100 treinos" },
  { min: 101, label: "Peach Power", desc: "101–250 treinos" },
  { min: 251, label: "Legendary Peach", desc: "250+ treinos" },
];

export function getLevel(totalDone) {
  if (totalDone <= 0) return LEVELS[0];

  return (
    [...LEVELS].reverse().find((level) => totalDone >= level.min) ||
    LEVELS[0]
  );
}

export function getNextLevel(totalDone) {
  return (
    LEVELS.find((level) => totalDone < level.min) ||
    LEVELS[LEVELS.length - 1]
  );
}

export function getLevelPct(totalDone) {
  const current = getLevel(totalDone);
  const next = getNextLevel(totalDone);

  if (current.min === next.min) return 100;

  return Math.min(
    100,
    Math.round(
      ((totalDone - current.min) / (next.min - current.min)) * 100
    )
  );
}

// Compatibilidade com nomes antigos
export const getMomentumLevel = getLevel;
export const getMomentumNext = getNextLevel;
export const getMomentumPct = getLevelPct;

export const ACHIEVEMENTS = [
  {
    id: "primeira_semana",
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
    desc: "4 semanas seguidas",
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

export function calcConsistencyStreak(
  doneSessions,
  workoutDays = [1, 2, 3, 4, 5]
) {
  if (!doneSessions.length || !workoutDays.length) return 0;

  const trainedDays = new Set(
    doneSessions
      .map((session) => session.date?.slice(0, 10))
      .filter(Boolean)
  );

  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const weekday = day.getDay();
    const iso = day.toISOString().slice(0, 10);

    if (!workoutDays.includes(weekday)) continue;

    if (trainedDays.has(iso)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function calcWeeklyProgress(
  doneSessions,
  workoutDays = [1, 2, 3, 4, 5]
) {
  const today = new Date();
  const start = new Date(today);

  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const trainedThisWeek = new Set(
    doneSessions
      .filter((session) => {
        const date = new Date(session.date);
        return date >= start && date < end;
      })
      .map((session) => session.date.slice(0, 10))
  );

  const target = workoutDays.length || 5;
  const done = trainedThisWeek.size;

  return {
    done,
    target,
    pct: Math.min(100, Math.round((done / target) * 100)),
  };
}

export function calcMachinePRs(allExercises) {
  const prs = {};

  allExercises.forEach((exercise) => {
    const best = Math.max(
      ...(exercise.weightHistory || []).map(
        (entry) => parseFloat(entry.weight) || 0
      ),
      0
    );

    if (best > 0) {
      if (!prs[exercise.machine] || best > prs[exercise.machine]) {
        prs[exercise.machine] = best;
      }
    }
  });

  return prs;
}

export function calcWorkoutVolume(session) {
  const exercises = [
    ...(session.lower || []),
    ...(session.upper || []),
  ];

  return exercises.reduce((total, exercise) => {
    const weight = parseFloat(exercise.weight) || 0;
    const series = parseFloat(exercise.series) || 1;

    return total + weight * series;
  }, 0);
}

export function getCompletionMessage() {
  return "Pump entregue. 🍑";
}
