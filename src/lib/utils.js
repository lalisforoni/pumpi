export function calcDuration(start, end) {
  if (!start || !end) return null;

  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);

  return hours > 0
    ? `${hours}h ${minutes % 60}min`
    : `${minutes}min`;
}

export function calcMinutes(start, end) {
  if (!start || !end) return 0;

  return Math.max(0, Math.floor((end - start) / 60000));
}

export function withTimeout(promise, ms, label = "timeout") {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(label)), ms)
  );

  return Promise.race([promise, timeout]);
}

export function formatDateBR(date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function formatLongDateBR(date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
