import { useEffect, useState } from "react";

export default function useTimer(startedAt, active) {
  const getElapsed = () => {
    if (!active || !startedAt) return 0;

    return Math.max(
      0,
      Math.floor((Date.now() - Number(startedAt)) / 1000)
    );
  };

  const [elapsed, setElapsed] = useState(getElapsed);

  useEffect(() => {
    if (!active || !startedAt) {
      setElapsed(0);
      return;
    }

    const update = () => {
      setElapsed(
        Math.max(
          0,
          Math.floor((Date.now() - Number(startedAt)) / 1000)
        )
      );
    };

    update();

    const id = setInterval(update, 1000);

    return () => clearInterval(id);
  }, [active, startedAt]);

  const seconds = elapsed % 60;
  const minutes = Math.floor(elapsed / 60) % 60;
  const hours = Math.floor(elapsed / 3600);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}
