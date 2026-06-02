import { useState } from "react";
import { supabase } from "../lib/supabase";
import { getMomentumLevel, getMomentumNext, getMomentumPct } from "../lib/gamification";
import { getWorkoutDays } from "../lib/storage";

export default function ProfileView({ profile, sessions, theme, onLogout, user, syncStatus }) {
  const T = theme;
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [feedbackText, setFeedbackText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const doneSessions = sessions.filter(s => s.status === "done");
  const totalDone = doneSessions.length;
  const momentum = getMomentumLevel(totalDone);
  const momentumNext = getMomentumNext(totalDone);
  const momentumPct = getMomentumPct(totalDone);

  const totalHours = Math.floor(
    doneSessions.filter(s => s.startedAt && s.finishedAt)
      .reduce((a, s) => a + (s.finishedAt - s.startedAt), 0) / (1000 * 60 * 60)
  );

  const downloadCSV = () => {
    const rows = [];
    sessions.forEach(s => {
      [...(s.lower || []), ...(s.upper || [])].forEach(ex => {
        rows.push({
          date: s.date?.slice(0, 10), status: s.status,
          group: (s.lower || []).includes(ex) ? "lower" : "upper",
          machine: ex.machine || "", weight: ex.weight || "",
          series: ex.series || "", reps: ex.reps || "", rp: ex.rp || "",
          manual: s.manual ? "yes" : "no",
        });
      });
    });
    const header = ["date", "status", "group", "machine", "weight", "series", "reps", "rp", "manual"];
    const csv = [header.join(","), ...rows.map(row => header.map(h => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pumpi_treinos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const changePassword = async () => {
    if (!profile?.email) { alert("Email não encontrado."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: "https://pumpi-two.vercel.app/confirmed.html",
    });
    if (error) alert("Erro: " + error.message);
    else alert("Email para mudar senha enviado 🍑");
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) { alert("Escreva sua mensagem primeiro."); return; }
    setSendingFeedback(true);
    const { error } = await supabase.from("suggestions").insert({
      user_id: user?.id, type: feedbackType, message: feedbackText.trim(),
    });
    setSendingFeedback(false);
    if (error) { alert("Erro ao enviar: " + error.message); return; }
    setFeedbackText(""); setFeedbackType("suggestion");
    alert("Mensagem enviada! 🍑");
  };

  const Card = ({ children, style = {} }) => (
    <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "16px", padding: "20px", marginBottom: "12px", ...style }}>
      {children}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <p style={{ color: T.textMuted, fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", margin: "0 0 12px" }}>
      {children}
    </p>
  );

  return (
    <div>
      {/* Perfil */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "48px", height: "48px", background: `${T.accent}20`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🍑</div>
          <div>
            <p style={{ color: T.text, fontSize: "16px", fontWeight: 800, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>@{profile?.username}</p>
            <p style={{ color: T.textMuted, fontSize: "12px", margin: "2px 0 0", fontFamily: "'DM Sans',sans-serif" }}>{profile?.email}</p>
          </div>
        </div>
      </Card>

      {/* Momentum */}
      <div style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.id === "manha" ? "#c96b6b" : T.blue} 100%)`, borderRadius: "16px", padding: "20px", marginBottom: "12px", boxShadow: `0 8px 24px ${T.accent}30` }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", margin: "0 0 4px" }}>Nível atual</p>
        <p style={{ color: "#fff", fontSize: "22px", fontWeight: 800, margin: "0 0 14px", fontFamily: "'DM Sans',sans-serif", letterSpacing: "-0.5px" }}>{momentum.label}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", marginBottom: "14px" }}>
          {[
            { val: totalDone, label: "treinos" },
            { val: `${totalHours}h`, label: "treinadas" },
            { val: sessions.length, label: "total" },
          ].map((s, i) => (
            <div key={i}>
              <p style={{ color: "#fff", fontSize: "18px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace" }}>{s.val}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontFamily: "'DM Sans',sans-serif" }}>{totalDone} treinos</span>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", fontFamily: "'DM Sans',sans-serif" }}>{momentumNext.min} para {momentumNext.label}</span>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${momentumPct}%`, background: "rgba(255,255,255,0.85)", borderRadius: "99px", transition: "width .6s ease" }} />
          </div>
        </div>
      </div>

      {/* Sincronização — só mostra se houver status ativo */}
      {syncStatus && syncStatus !== null && (
        <Card>
          <p style={{ color: T.text, fontWeight: 700, margin: "0 0 6px", fontFamily: "'DM Sans',sans-serif" }}>☁️ Sincronização</p>
          <p style={{ color: syncStatus === "saved" ? T.green : syncStatus === "error" ? T.danger : T.accent, fontWeight: 600, margin: 0, fontFamily: "'DM Sans',sans-serif", fontSize: "13px" }}>
            {syncStatus === "saving" && "Salvando..."}
            {syncStatus === "saved" && "✓ Tudo sincronizado"}
            {syncStatus === "error" && "Erro ao sincronizar"}
          </p>
        </Card>
      )}

      {/* Suporte */}
      <Card>
        <SectionLabel>Suporte e sugestões</SectionLabel>
        <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${T.inputBorder}`, background: T.inputBg, color: T.text, marginBottom: "10px", fontFamily: "'DM Sans',sans-serif", outline: "none" }}>
          <option value="suggestion">Sugestão</option>
          <option value="support">Suporte / problema</option>
        </select>
        <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Escreva aqui..." rows={4}
          style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${T.inputBorder}`, background: T.inputBg, color: T.text, resize: "none", marginBottom: "10px", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
        <button onClick={sendFeedback} disabled={sendingFeedback}
          style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: T.accent, color: T.accentText, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          {sendingFeedback ? "Enviando..." : "Enviar mensagem"}
        </button>
      </Card>

      {/* Ações */}
      <button onClick={downloadCSV} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: T.accent, color: T.accentText, fontWeight: 700, marginBottom: "10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
        Baixar treinos em CSV 📥
      </button>
      <button onClick={changePassword} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1px solid ${T.bgCardBorder}`, background: T.bgCard, color: T.text, marginBottom: "10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
        Mudar senha 🔐
      </button>
      <button onClick={onLogout} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: T.danger, color: "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
        Sair
      </button>
    </div>
  );
}
