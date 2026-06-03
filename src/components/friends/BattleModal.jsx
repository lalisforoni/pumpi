export default function BattleModal({
  theme,
  battle,
  detail,
  loading,
  onClose,
}) {
  const T = theme;

  const unit = getBattleUnit(battle.type);
  const period = getPeriod(battle);

  const myValue = detail?.myValue || 0;
  const friendValue = detail?.friendValue || 0;
  const max = Math.max(myValue, friendValue, 1);

  const winner =
    myValue === friendValue
      ? "Empate até agora."
      : myValue > friendValue
      ? "Você está na frente."
      : `@${detail?.friend?.username || "amiga"} está na frente.`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.76)",
        zIndex: 240,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: T.modalBg,
          border: `1px solid ${T.bgCardBorder}`,
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 40px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "82vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "4px",
            background: `${T.accent}40`,
            borderRadius: "2px",
            margin: "0 auto 20px",
          }}
        />

        <p
          style={{
            color: T.textMuted,
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            fontFamily: "'DM Sans',sans-serif",
            margin: "0 0 8px",
          }}
        >
          Comparação ativa
        </p>

        <h2
          style={{
            color: T.text,
            fontSize: "22px",
            fontWeight: 800,
            margin: "0 0 6px",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {getBattleEmoji(battle.type)} {getBattleTitle(battle.type)}
        </h2>

        <p
          style={{
            color: T.textMuted,
            fontSize: "12px",
            lineHeight: 1.5,
            margin: "0 0 18px",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {period.start.toLocaleDateString("pt-BR")} até{" "}
          {period.end.toLocaleDateString("pt-BR")}
        </p>

        {loading && (
          <p
            style={{
              color: T.textSub,
              fontSize: "13px",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Carregando placar...
          </p>
        )}

        {!loading && detail?.error && (
          <div
            style={{
              background: `${T.danger}12`,
              border: `1px solid ${T.danger}25`,
              borderRadius: "14px",
              padding: "14px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                color: T.danger,
                fontSize: "12px",
                lineHeight: 1.5,
                margin: 0,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {detail.error}
            </p>
          </div>
        )}

        {!loading && detail && !detail.error && (
          <>
            <div
              style={{
                background: T.bgCard,
                border: `1px solid ${T.bgCardBorder}`,
                borderRadius: "18px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  color: T.text,
                  fontSize: "15px",
                  fontWeight: 800,
                  margin: "0 0 12px",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {winner}
              </p>

              <BattleBar
                label="Você"
                value={myValue}
                max={max}
                unit={unit}
                color={T.accent}
                T={T}
              />

              <BattleBar
                label={`@${detail.friend.username}`}
                value={friendValue}
                max={max}
                unit={unit}
                color={T.green}
                T={T}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <ScoreBox
                label="Seus registros"
                value={detail.mySessions.length}
                T={T}
              />

              <ScoreBox
                label="Registros amiga"
                value={detail.friendSessions.length}
                T={T}
              />
            </div>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: T.accent,
            border: "none",
            borderRadius: "14px",
            color: T.accentText,
            fontWeight: 800,
            fontSize: "13px",
            padding: "14px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

function getBattleTitle(type) {
  if (type === "streak") return "Sequência de treinos";
  if (type === "lower") return "Lower Body";
  return "Treinos concluídos";
}

function getBattleUnit(type) {
  if (type === "streak") return "dias";
  if (type === "lower") return "exercícios";
  return "treinos";
}

function getBattleEmoji(type) {
  if (type === "streak") return "🔥";
  if (type === "lower") return "🍑";
  return "💪";
}

function getPeriod(battle) {
  const end = battle.ends_at ? new Date(battle.ends_at) : new Date();

  const start = battle.created_at
    ? new Date(battle.created_at)
    : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  return { start, end };
}

function BattleBar({ label, value, max, unit, color, T }) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            color: T.text,
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {label}
        </span>

        <span
          style={{
            color,
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: "'DM Mono',monospace",
          }}
        >
          {value} {unit}
        </span>
      </div>

      <div
        style={{
          height: "8px",
          background: T.bgCardBorder,
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "99px",
            transition: "width .5s ease",
          }}
        />
      </div>
    </div>
  );
}

function ScoreBox({ label, value, T }) {
  return (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "14px",
        padding: "12px",
      }}
    >
      <p
        style={{
          color: T.accent,
          fontSize: "20px",
          fontWeight: 800,
          margin: 0,
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {value}
      </p>

      <p
        style={{
          color: T.textMuted,
          fontSize: "10px",
          margin: "3px 0 0",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {label}
      </p>
    </div>
  );
}
