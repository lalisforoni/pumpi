import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginScreen({ theme, onLogin }) {
  const T = theme;
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
          }, { onConflict: "id" });
          if (data.session) onLogin(data.user);
          else setSuccess("Conta criada! Verifique seu email. 🍑");
        }
      }
    } catch (e) { setError(e.message || "Erro ao entrar"); }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Digite seu email primeiro!"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://pumpi-two.vercel.app/confirmed.html",
    });
    if (error) setError(error.message);
    else setSuccess("Email de recuperação enviado! 🍑");
    setLoading(false);
  };

  const inp = {
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: "12px", color: T.text, fontSize: "15px",
    padding: "14px 16px", width: "100%", fontFamily: "'DM Sans',sans-serif",
    outline: "none", marginBottom: "10px",
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "56px", marginBottom: "10px" }}>🍑</div>
          <h1 style={{ color: T.accent, fontSize: "26px", fontWeight: 800, fontFamily: "'DM Sans',sans-serif", letterSpacing: "-0.5px" }}>Pumpi</h1>
          <p style={{ color: T.textMuted, fontSize: "12px", fontFamily: "'DM Sans',sans-serif", marginTop: "4px" }}>Progresso de Treino</p>
        </div>

        <div style={{ display: "flex", background: T.bgCard, borderRadius: "12px", padding: "4px", marginBottom: "20px", border: `1px solid ${T.bgCardBorder}` }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              style={{ flex: 1, padding: "10px", background: mode === m ? T.accent : "transparent", border: "none", borderRadius: "8px", color: mode === m ? T.accentText : T.textSub, fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {mode === "signup" && <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inp} />}
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" style={inp} />
        <input placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} type="password" style={{ ...inp, marginBottom: "16px" }} />

        {error && <p style={{ color: T.danger, fontSize: "12px", fontFamily: "'DM Sans',sans-serif", marginBottom: "10px", textAlign: "center" }}>{error}</p>}
        {success && <p style={{ color: T.green, fontSize: "12px", fontFamily: "'DM Sans',sans-serif", marginBottom: "10px", textAlign: "center" }}>{success}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ background: T.accent, border: "none", borderRadius: "14px", color: T.accentText, fontWeight: 800, fontSize: "15px", padding: "15px", width: "100%", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : (mode === "login" ? "Entrar" : "Criar conta")}
        </button>

        {mode === "login" && (
          <button onClick={handleForgotPassword} disabled={loading}
            style={{ background: "none", border: "none", color: T.textMuted, fontSize: "12px", cursor: "pointer", width: "100%", marginTop: "14px", fontFamily: "'DM Sans',sans-serif", textDecoration: "underline" }}>
            Esqueci minha senha
          </button>
        )}
      </div>
    </div>
  );
}
