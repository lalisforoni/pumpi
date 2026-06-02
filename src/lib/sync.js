export function shouldSyncSession(session) {
  return session?.status === "active" || session?.status === "done";
}

export function markSessionUpdated(session) {
  return {
    ...session,
    updatedAt: Date.now(),
  };
}
