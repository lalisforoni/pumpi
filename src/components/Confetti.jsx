import { useEffect, useRef } from "react";

export default function Confetti({ onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    const cols = ["#d9895b","#f2a07e","#6fa886","#c87aff","#f0b84a","#fff","#60d0ff","#ffb3d9"];
    const ps = Array.from({ length: 120 }, () => ({
      x: Math.random() * c.width,
      y: -30 - Math.random() * 300,
      d: 1.5 + Math.random() * 3,
      color: cols[Math.floor(Math.random() * cols.length)],
      spin: (Math.random() - 0.5) * 0.18,
      angle: Math.random() * Math.PI * 2,
      w: 5 + Math.random() * 9,
      h: 3 + Math.random() * 5,
      shape: Math.random() > 0.5 ? "rect" : "circle",
      wave: Math.random() * Math.PI * 2,
    }));

    let fr, el = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      const a = Math.max(0, 1 - el / 200);
      ps.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        if (p.shape === "rect") ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        else { ctx.beginPath(); ctx.arc(0, 0, p.w / 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        p.y += p.d;
        p.x += Math.sin(p.wave + el * 0.025) * 1.4;
        p.angle += p.spin;
        p.wave += 0.02;
        if (p.y > c.height + 20) { p.y = -20; p.x = Math.random() * c.width; }
      });
      el++;
      if (el < 240) fr = requestAnimationFrame(draw);
      else onDone();
    };

    draw();
    return () => cancelAnimationFrame(fr);
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 998, pointerEvents: "none" }} />;
}
