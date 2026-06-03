export function shouldSyncSession(session) {
  return ["pending", "active", "done"].includes(session?.status);
}

export function markSessionUpdated(session) {
  return {
    ...session,
    updatedAt: Date.now(),
  };
}
