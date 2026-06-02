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
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;
        if (data.user) onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              username: username.trim().toLowerCase(),
              email: email.trim().toLowerCase(),
            },
            { onConflict: "id" }
          );

          if (data.session) {
            onLogin(data.user);
          } else {
            setSuccess("Conta criada. Confirme seu email para entrar.");
          }
        }
      }
    } catch (e) {
      setError(e.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Digite seu email primeiro.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: "https://pumpi-two.vercel.app/confirmed.html",
      }
    );

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Email de recuperação enviado.");
    }

    setLoading(false);
  };

  const inputStyle = {
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: "14px",
    color: T.text,
    fontSize: "15px",
    padding: "14px 16px",
    width: "100%",
    fontFamily: "'DM Sans',sans-serif",
    outline: "none",
    marginBottom: "10px",
  };

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "370px" }}>
        <div style={{ textAlign: "center", marginBottom: "34px" }}>
          <div
            style={{
              width: "78px",
              height: "78px",
              borderRadius: "26px",
              background: `${T.accent}18`,
              border: `1px solid ${T.accent}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              fontSize: "40px",
            }}
          >
            🍑
          </div>

          <p
            style={{
              color: T.textMuted,
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
              fontFamily: "'DM Sans',sans-serif",
              margin: "0 0 10px",
            }}
          >
            PUMPI
          </p>

          <h1
            style={{
              color: T.text,
              fontSize: "30px",
              fontWeight: 800,
              lineHeight: 1.05,
              fontFamily: "'DM Sans',sans-serif",
              margin: 0,
            }}
          >
            Seu treino.
            <br />
            Seu pump.
            <br />
            Seu progresso.
          </h1>

          <p
            style={{
              color: T.textSub,
              fontSize: "13px",
              lineHeight: 1.6,
              fontFamily: "'DM Sans',sans-serif",
              marginTop: "14px",
            }}
          >
            O app de treino que transforma
            <br />
            consistência em resultados.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            background: T.bgCard,
            borderRadius: "14px",
            padding: "4px",
            marginBottom: "18px",
            border: `1px solid ${T.bgCardBorder}`,
          }}
        >
          {["login", "signup"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setMode(item);
                setError("");
                setSuccess("");
              }}
              style={{
                flex: 1,
                padding: "11px",
                background: mode === item ? T.accent : "transparent",
                border: "none",
                borderRadius: "10px",
                color: mode === item ? T.accentText : T.textSub,
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {item === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          style={inputStyle}
        />

        <input
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          style={{ ...inputStyle, marginBottom: "14px" }}
        />

        {error && (
          <p
            style={{
              color: T.danger,
              fontSize: "12px",
              fontFamily: "'DM Sans',sans-serif",
              marginBottom: "10px",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            style={{
              color: T.green,
              fontSize: "12px",
              fontFamily: "'DM Sans',sans-serif",
              marginBottom: "10px",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {success}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: T.accent,
            border: "none",
            borderRadius: "16px",
            color: T.accentText,
            fontWeight: 800,
            fontSize: "13px",
            padding: "15px",
            width: "100%",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            opacity: loading ? 0.7 : 1,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          {loading
            ? "Carregando..."
            : mode === "login"
            ? "Entrar"
            : "Criar conta"}
        </button>

        {mode === "login" && (
          <button
            onClick={handleForgotPassword}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: T.textMuted,
              fontSize: "12px",
              cursor: "pointer",
              width: "100%",
              marginTop: "14px",
              fontFamily: "'DM Sans',sans-serif",
              textDecoration: "underline",
            }}
          >
            Esqueci minha senha
          </button>
        )}
      </div>
    </div>
  );
}
