import { useEffect, useState } from "react";

export default function useTimer(startedAt, active) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) return;

    const update = () => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };

    update();

    const id = setInterval(update, 1000);

    return () => clearInterval(id);
  }, [active, startedAt]);

  const seconds = elapsed % 60;
  const minutes = Math.floor(elapsed / 60) % 60;
  const hours = Math.floor(elapsed / 3600);

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
}
