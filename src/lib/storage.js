export const STORAGE_KEY = "pumpi_v1";
export const PENDING_KEY = "pumpi_pending_sync";
export const DELETED_KEY = "pumpi_deleted_sessions";
export const WORKOUT_DAYS_KEY = "pumpi_workout_days";
export const FRIENDS_CACHE_KEY = "pumpi_friends_cache";
export const WORKOUT_PLANS_KEY = "pumpi_workout_plans";
export const NOTIFICATION_SETTINGS_KEY = "pumpi_notification_settings";

const DEFAULT_WORKOUT_DAYS = [1, 2, 3, 4, 5];

const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,
  hour: "19:00",
  days: [1, 2, 3, 4, 5],
  remindIfNoWorkout: true,
  streakReminder: true,
};

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

// ── Pending Sync ─────────────────────────────────────────────
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

// ── Workout Days ─────────────────────────────────────────────
export function getWorkoutDays() {
  return readJSON(WORKOUT_DAYS_KEY, DEFAULT_WORKOUT_DAYS);
}

export function saveWorkoutDays(days) {
  const normalized = Array.isArray(days) ? days : DEFAULT_WORKOUT_DAYS;
  writeJSON(WORKOUT_DAYS_KEY, normalized);
  return normalized;
}

// ── Notification Settings ────────────────────────────────────
export function getNotificationSettings() {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...readJSON(NOTIFICATION_SETTINGS_KEY, DEFAULT_NOTIFICATION_SETTINGS),
  };
}

export function saveNotificationSettings(settings) {
  const normalized = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(settings || {}),
    days: Array.isArray(settings?.days)
      ? settings.days
      : DEFAULT_NOTIFICATION_SETTINGS.days,
  };

  writeJSON(NOTIFICATION_SETTINGS_KEY, normalized);
  return normalized;
}

export function clearNotificationSettings() {
  try {
    localStorage.removeItem(NOTIFICATION_SETTINGS_KEY);
  } catch {}
}

// ── Friends Cache ────────────────────────────────────────────
export function getFriendsCache() {
  return readJSON(FRIENDS_CACHE_KEY, null);
}

export function saveFriendsCache(data) {
  writeJSON(FRIENDS_CACHE_KEY, data);
}

export function clearFriendsCache() {
  try {
    localStorage.removeItem(FRIENDS_CACHE_KEY);
  } catch {}
}

// ── Workout Plans / Fichas ───────────────────────────────────
export function getWorkoutPlans() {
  return readJSON(WORKOUT_PLANS_KEY, []);
}

export function saveWorkoutPlans(plans) {
  const normalized = (plans || []).map((plan) => ({
    ...plan,
    lower: plan.lower || [],
    upper: plan.upper || [],
    updatedAt: plan.updatedAt || Date.now(),
  }));

  writeJSON(WORKOUT_PLANS_KEY, normalized);
  return normalized;
}

export function addWorkoutPlan(plan) {
  const now = Date.now();

  const newPlan = {
    id: plan.id || now,
    name: plan.name || "Nova ficha",
    description: plan.description || "",
    lower: plan.lower || [],
    upper: plan.upper || [],
    createdAt: plan.createdAt || now,
    updatedAt: now,
  };

  const plans = getWorkoutPlans();
  const next = [newPlan, ...plans];

  return saveWorkoutPlans(next);
}

export function updateWorkoutPlan(planId, updatedPlan) {
  const now = Date.now();

  const plans = getWorkoutPlans().map((plan) =>
    String(plan.id) === String(planId)
      ? {
          ...plan,
          ...updatedPlan,
          lower: updatedPlan.lower || plan.lower || [],
          upper: updatedPlan.upper || plan.upper || [],
          updatedAt: now,
        }
      : plan
  );

  return saveWorkoutPlans(plans);
}

export function deleteWorkoutPlan(planId) {
  const plans = getWorkoutPlans().filter(
    (plan) => String(plan.id) !== String(planId)
  );

  return saveWorkoutPlans(plans);
}

// ── Local Sessions ───────────────────────────────────────────
export function getLocalSessions() {
  const local = readJSON(STORAGE_KEY, {
    sessions: [],
  });

  return sortSessions(local.sessions || []);
}

export function saveLocalSessions(sessions) {
  const sorted = sortSessions(sessions || []);

  writeJSON(STORAGE_KEY, {
    sessions: sorted,
  });

  return sorted;
}

export function clearLocalSessions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Session Helpers ──────────────────────────────────────────
export function getSessionSortTime(session) {
  const dateTime = Date.parse(session?.date);

  if (!Number.isNaN(dateTime)) {
    return dateTime;
  }

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
      getSessionSortTime(b) -
      getSessionSortTime(a);

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
    remote.map((session) => [
      String(session.id),
      session,
    ])
  );

  const localById = new Map(
    local.map((session) => [
      String(session.id),
      session,
    ])
  );

  const ids = new Set([
    ...remoteById.keys(),
    ...localById.keys(),
  ]);

  return sortSessions(
    [...ids].map((id) =>
      mergeSessionPair(
        remoteById.get(id),
        localById.get(id)
      )
    )
  );
}
