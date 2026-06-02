export function calcDuration(a, b) {
  if (!a || !b) return null;
  const m = Math.floor((b - a) / 60000);
  const hh = Math.floor(m / 60);
  return hh > 0 ? `${hh}h ${m % 60}min` : `${m}min`;
}

export function useTimer(startedAt, active) {
  const { useState, useEffect } = require("react");
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active || !startedAt) return;
    const upd = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);
  const s = elapsed % 60, m = Math.floor(elapsed / 60) % 60, hh = Math.floor(elapsed / 3600);
  return hh > 0
    ? `${String(hh).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
