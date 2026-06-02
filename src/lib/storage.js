export const STORAGE_KEY = "pumpi_v1";
export const PENDING_KEY = "pumpi_pending_sync";
export const DELETED_KEY = "pumpi_deleted_sessions";
export const WORKOUT_DAYS_KEY = "pumpi_workout_days";

// ── Deleted IDs ──────────────────────────────────────────────
export function getDeletedSessionIds() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || "[]").map(String); }
  catch { return []; }
}

export function setDeletedSessionIds(ids) {
  try { localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids.map(String))])); }
  catch {}
}

export function addDeletedSessionId(id) {
  setDeletedSessionIds([...getDeletedSessionIds(), String(id)]);
}

export function removeDeletedSessionId(id) {
  setDeletedSessionIds(getDeletedSessionIds().filter(x => x !== String(id)));
}

// ── Workout days (dias configurados pelo usuário) ─────────────
export function getWorkoutDays() {
  try {
    const saved = localStorage.getItem(WORKOUT_DAYS_KEY);
    return saved ? JSON.parse(saved) : [1, 2, 3, 4, 5]; // seg–sex default
  } catch { return [1, 2, 3, 4, 5]; }
}

export function saveWorkoutDays(days) {
  try { localStorage.setItem(WORKOUT_DAYS_KEY, JSON.stringify(days)); }
  catch {}
}

// ── Session helpers ───────────────────────────────────────────
export function getSessionSortTime(session) {
  const dateTime = Date.parse(session?.date);
  if (!Number.isNaN(dateTime)) return dateTime;
  return Number(session?.finishedAt ?? session?.startedAt ?? session?.id ?? 0) || 0;
}

export function sortSessions(sessions = []) {
  return [...sessions].sort((a, b) => {
    const diff = getSessionSortTime(b) - getSessionSortTime(a);
    return diff !== 0 ? diff : Number(b.id || 0) - Number(a.id || 0);
  });
}

function mergeSessionPair(remote, local) {
  if (!remote) return local;
  if (!local) return remote;
  const rv = Number(remote.updatedAt || remote.finishedAt || remote.startedAt || remote.id || 0);
  const lv = Number(local.updatedAt || local.finishedAt || local.startedAt || local.id || 0);
  return rv >= lv ? remote : local;
}

export function mergeSessions(remote = [], local = []) {
  const remoteById = new Map(remote.map(s => [String(s.id), s]));
  const localById = new Map(local.map(s => [String(s.id), s]));
  const ids = new Set([...remoteById.keys(), ...localById.keys()]);
  return sortSessions([...ids].map(id => mergeSessionPair(remoteById.get(id), localById.get(id))));
}
