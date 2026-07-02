import { useState } from "react";
import { supabase } from "../lib/supabase";
import { getLevel, getNextLevel, getLevelPct } from "../lib/gamification";
import NotificationSettings from "./profile/NotificationSettings";

export default function ProfileView({
  profile,
  sessions,
  theme,
  onLogout,
  user,
  syncStatus,
}) {
  const T = theme;

  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [feedbackText, setFeedbackText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const doneSessions = sessions.filter((s) => s.status === "done");
  const totalDone = doneSessions.length;

  const level = getLevel(totalDone);
  const nextLevel = getNextLevel(totalDone);
  const levelPct = getLevelPct(totalDone);

  const totalHours = Math.floor(
    doneSessions
      .filter((s) => s.startedAt && s.finishedAt)
      .reduce((acc, s) => acc + (s.finishedAt - s.startedAt), 0) /
      (1000 * 60 * 60)
  );

  const displayName =
    profile?.username || user?.email?.split("@")[0] || "usuária";

  const downloadCSV = () => {
    const rows = [];

    sessions.forEach((session) => {
      [...(session.lower || []), ...(session.upper || [])].forEach(
        (exercise) => {
          rows.push({
            date: session.date?.slice(0, 10),
            status: session.status,
            group: (session.lower || []).includes(exercise)
              ? "lower"
              : "upper",
            machine: exercise.machine || "",
            weight: exercise.weight || "",
            series: exercise.series || "",
            reps: exercise.reps || "",
            rp: exercise.rp || "",
            manual: session.manual ? "yes" : "no",
          });
        }
      );
    });

    const header = [
      "date",
      "status",
      "group",
      "machine",
      "weight",
      "series",
      "reps",
      "rp",
      "manual",
    ];

    const csv = [
      header.join(","),
      ...rows.map((row) =>
        header
          .map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "pumpi_treinos.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const changePassword = async () => {
    if (!profile?.email) {
      alert("Email não encontrado.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      profile.email,
      {
        redirectTo: "https://pumpi-two.vercel.app/confirmed.html",
      }
    );

    if (error) alert("Erro: " + error.message);
    else alert("Email para mudar senha enviado 🍑");
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      alert("Escreva sua mensagem primeiro.");
      return;
    }

    setSendingFeedback(true);

    const { error } = await supabase.from("suggestions").insert({
      user_id: user?.id,
      type: feedbackType,
      message: feedbackText.trim(),
    });

    setSendingFeedback(false);

    if (error) {
      alert("Erro ao enviar: " + error.message);
      return;
    }

    setFeedbackText("");
    setFeedbackType("suggestion");
    alert("Mensagem enviada! 🍑");
  };

  const Card = ({ children, style = {} }) => (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "12px",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <p
      style={{
        color: T.textMuted,
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "2px",
        textTransform: "uppercase",
        fontFamily: "'DM Sans',sans-serif",
        margin: "0 0 12px",
      }}
    >
      {children}
    </p>
  );

  return (
    <div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: `${T.accent}18`,
              border: `1px solid ${T.accent}25`,
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            🍑
          </div>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                color: T.text,
                fontSize: "18px",
                fontWeight: 800,
                margin: 0,
                fontFamily: "'DM Sans',sans-serif",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{displayName}
            </p>

            <p
              style={{
                color: T.textMuted,
                fontSize: "12px",
                margin: "3px 0 0",
                fontFamily: "'DM Sans',sans-serif",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.email || user?.email}
            </p>
          </div>
        </div>
      </Card>

      <div
        style={{
          background: `linear-gradient(135deg, ${T.accent} 0%, ${
            T.peach || "#FF9E80"
          } 100%)`,
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "12px",
          boxShadow: `0 10px 26px ${T.accent}25`,
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontFamily: "'DM Sans',sans-serif",
            margin: "0 0 5px",
          }}
        >
          Nível atual
        </p>

        <p
          style={{
            color: "#fff",
            fontSize: "24px",
            fontWeight: 800,
            margin: "0 0 4px",
            fontFamily: "'DM Sans',sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          {level.label}
        </p>

        <p
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: "12px",
            margin: "0 0 16px",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {level.desc}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          {[
            { val: totalDone, label: "treinos" },
            { val: `${totalHours}h`, label: "treinadas" },
            { val: sessions.length, label: "registros" },
          ].map((item, index) => (
            <div key={index}>
              <p
                style={{
                  color: "#fff",
                  fontSize: "19px",
                  fontWeight: 800,
                  margin: 0,
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {item.val}
              </p>

              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "10px",
                  margin: 0,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "7px",
              gap: "8px",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "11px",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {totalDone} treinos
            </span>

            <span
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "11px",
                fontFamily: "'DM Sans',sans-serif",
                textAlign: "right",
              }}
            >
              Próximo: {nextLevel.label}
            </span>
          </div>

          <div
            style={{
              height: "5px",
              background: "rgba(255,255,255,0.22)",
              borderRadius: "99px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${levelPct}%`,
                background: "rgba(255,255,255,0.9)",
                borderRadius: "99px",
                transition: "width .6s ease",
              }}
            />
          </div>
        </div>
      </div>

      {syncStatus && (
        <Card>
          <SectionLabel>Sincronização</SectionLabel>

          <p
            style={{
              color:
                syncStatus === "saved"
                  ? T.green
                  : syncStatus === "error"
                  ? T.danger
                  : T.accent,
              fontWeight: 800,
              margin: 0,
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "13px",
            }}
          >
            {syncStatus === "saving" && "Salvando..."}
            {syncStatus === "saved" && "Tudo sincronizado"}
            {syncStatus === "error" && "Erro ao sincronizar"}
          </p>
        </Card>
      )}

      <NotificationSettings theme={T} />

      <Card>
        <SectionLabel>Suporte e sugestões</SectionLabel>

        <select
          value={feedbackType}
          onChange={(e) => setFeedbackType(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: `1px solid ${T.inputBorder}`,
            background: T.inputBg,
            color: T.text,
            marginBottom: "10px",
            fontFamily: "'DM Sans',sans-serif",
            outline: "none",
          }}
        >
          <option value="suggestion">Sugestão</option>
          <option value="support">Suporte / problema</option>
        </select>

        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Escreva aqui..."
          rows={4}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: `1px solid ${T.inputBorder}`,
            background: T.inputBg,
            color: T.text,
            resize: "none",
            marginBottom: "10px",
            fontFamily: "'DM Sans',sans-serif",
            outline: "none",
          }}
        />

        <button
          onClick={sendFeedback}
          disabled={sendingFeedback}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "12px",
            border: "none",
            background: T.accent,
            color: T.accentText,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {sendingFeedback ? "Enviando..." : "Enviar mensagem"}
        </button>
      </Card>

      <button
        onClick={downloadCSV}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "none",
          background: T.accent,
          color: T.accentText,
          fontWeight: 800,
          marginBottom: "10px",
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        Baixar treinos em CSV
      </button>

      <button
        onClick={changePassword}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: `1px solid ${T.bgCardBorder}`,
          background: T.bgCard,
          color: T.text,
          marginBottom: "10px",
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
          fontWeight: 700,
        }}
      >
        Mudar senha
      </button>

      <button
        onClick={onLogout}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "none",
          background: T.danger,
          color: "#fff",
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
          fontWeight: 800,
        }}
      >
        Sair
      </button>
    </div>
  );
}
