export const STORAGE_KEY = "pumpi_v1";
export const PENDING_KEY = "pumpi_pending_sync";
export const DELETED_KEY = "pumpi_deleted_sessions";
export const WORKOUT_DAYS_KEY = "pumpi_workout_days";

const DEFAULT_WORKOUT_DAYS = [1, 2, 3, 4, 5];

// ── Safe JSON ────────────────────────────────────────────────
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Deleted IDs ──────────────────────────────────────────────
export function getDeletedSessionIds() {
  return readJSON(DELETED_KEY, []).map(String);
}

export function setDeletedSessionIds(ids) {
  writeJSON(DELETED_KEY, [...new Set(ids.map(String))]);
}

export function addDeletedSessionId(id) {
  setDeletedSessionIds([...getDeletedSessionIds(), String(id)]);
}

export function removeDeletedSessionId(id) {
  setDeletedSessionIds(
    getDeletedSessionIds().filter((x) => x !== String(id))
  );
}

// ── Pending sync ─────────────────────────────────────────────
export function getPendingSyncIds() {
  return readJSON(PENDING_KEY, []).map(String);
}

export function setPendingSyncIds(ids) {
  writeJSON(PENDING_KEY, [...new Set(ids.map(String))]);
}

export function addPendingSyncId(id) {
  setPendingSyncIds([...getPendingSyncIds(), String(id)]);
}

export function removePendingSyncId(id) {
  setPendingSyncIds(
    getPendingSyncIds().filter((x) => x !== String(id))
  );
}

export function clearPendingSyncIds() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
}

// ── Workout days ─────────────────────────────────────────────
export function getWorkoutDays() {
  return readJSON(WORKOUT_DAYS_KEY, DEFAULT_WORKOUT_DAYS);
}

export function saveWorkoutDays(days) {
  writeJSON(WORKOUT_DAYS_KEY, days);
}

// ── Local sessions ───────────────────────────────────────────
export function getLocalSessions() {
  const local = readJSON(STORAGE_KEY, { sessions: [] });
  return sortSessions(local.sessions || []);
}

export function saveLocalSessions(sessions) {
  const sorted = sortSessions(sessions || []);
  writeJSON(STORAGE_KEY, { sessions: sorted });
  return sorted;
}

export function clearLocalSessions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Session helpers ──────────────────────────────────────────
export function getSessionSortTime(session) {
  const dateTime = Date.parse(session?.date);

  if (!Number.isNaN(dateTime)) return dateTime;

  return (
    Number(
      session?.finishedAt ??
        session?.startedAt ??
        session?.id ??
        0
    ) || 0
  );
}

export function sortSessions(sessions = []) {
  return [...sessions].sort((a, b) => {
    const diff =
      getSessionSortTime(b) - getSessionSortTime(a);

    if (diff !== 0) return diff;

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function mergeSessionPair(remote, local) {
  if (!remote) return local;
  if (!local) return remote;

  const remoteUpdated = Number(
    remote.updatedAt ||
      remote.finishedAt ||
      remote.startedAt ||
      remote.id ||
      0
  );

  const localUpdated = Number(
    local.updatedAt ||
      local.finishedAt ||
      local.startedAt ||
      local.id ||
      0
  );

  return remoteUpdated >= localUpdated ? remote : local;
}

export function mergeSessions(remote = [], local = []) {
  const remoteById = new Map(
    remote.map((session) => [String(session.id), session])
  );

  const localById = new Map(
    local.map((session) => [String(session.id), session])
  );

  const ids = new Set([
    ...remoteById.keys(),
    ...localById.keys(),
  ]);

  return sortSessions(
    [...ids].map((id) =>
      mergeSessionPair(remoteById.get(id), localById.get(id))
    )
  );
}
