export default function BattlesView({
  theme,
  battles,
  friends,
  sessions,
  user,
  onOpenBattle,
}) {
  const T = theme;

  const myDone = sessions.filter((session) => session.status === "done").length;

  const myLower = sessions.reduce(
    (total, session) => total + (session.lower?.length || 0),
    0
  );

  const myStreak = () => {
    const done = sessions.filter((session) => session.status === "done");

    const days = [
      ...new Set(done.map((session) => session.date?.slice(0, 10)).filter(Boolean)),
    ].sort();

    if (!days.length) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    if (days[days.length - 1] !== today && days[days.length - 1] !== yesterday) {
      return 0;
    }

    let streak = 1;

    for (let i = days.length - 2; i >= 0; i--) {
      const diff =
        (new Date(days[i + 1]) - new Date(days[i])) /
        (1000 * 60 * 60 * 24);

      if (diff === 1) streak += 1;
      else break;
    }

    return streak;
  };

  const getBattleFriend = (battle) => {
    const otherId =
      battle.challenger_id === user?.id
        ? battle.opponent_id
        : battle.challenger_id;

    return (
      friends.find((friend) => friend.id === otherId) || {
        id: otherId,
        username: "amiga",
      }
    );
  };

  const getBattleTitle = (type) => {
    if (type === "streak") return "Sequência de treinos";
    if (type === "lower") return "Lower Body";
    return "Treinos concluídos";
  };

  const getBattleEmoji = (type) => {
    if (type === "streak") return "🔥";
    if (type === "lower") return "🍑";
    return "💪";
  };

  const Card = ({ children, style = {}, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "16px",
        padding: "14px",
        marginBottom: "10px",
        cursor: onClick ? "pointer" : "default",
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
        letterSpacing: "1.8px",
        textTransform: "uppercase",
        fontFamily: "'DM Sans',sans-serif",
        margin: "0 0 9px",
      }}
    >
      {children}
    </p>
  );

  return (
    <div>
      <Card
        style={{
          border: `1px solid ${T.accent}28`,
          marginBottom: "16px",
        }}
      >
        <SectionLabel>Meu status</SectionLabel>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
          }}
        >
          <MiniStat label="sequência" value={myStreak()} emoji="🔥" T={T} />
          <MiniStat label="lower" value={myLower} emoji="🍑" T={T} />
          <MiniStat label="treinos" value={myDone} emoji="💪" T={T} />
        </div>
      </Card>

      {battles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "42px 20px" }}>
          <p style={{ fontSize: "42px", marginBottom: "12px" }}>📈</p>

          <p
            style={{
              color: T.textSub,
              fontSize: "14px",
              lineHeight: 1.6,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Nenhuma comparação ativa.
            <br />
            Convide uma amiga para acompanhar progresso.
          </p>
        </div>
      ) : (
        battles.map((battle) => {
          const friend = getBattleFriend(battle);

          return (
            <Card
              key={battle.id}
              onClick={() => onOpenBattle(battle, friend)}
              style={{ border: `1px solid ${T.accent}25` }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div>
                  <p
                    style={{
                      color: T.accent,
                      fontSize: "12px",
                      fontWeight: 800,
                      margin: "0 0 4px",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {getBattleEmoji(battle.type)} {getBattleTitle(battle.type)}
                  </p>

                  <p
                    style={{
                      color: T.text,
                      fontSize: "13px",
                      fontWeight: 700,
                      margin: "0 0 4px",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    Você vs @{friend.username}
                  </p>

                  <p
                    style={{
                      color: T.textMuted,
                      fontSize: "11px",
                      margin: 0,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    Termina em{" "}
                    {new Date(battle.ends_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <span
                  style={{
                    color: T.textMuted,
                    fontSize: "18px",
                    lineHeight: 1,
                  }}
                >
                  ›
                </span>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function MiniStat({ label, value, emoji, T }) {
  return (
    <div>
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
        {emoji}
      </p>

      <p
        style={{
          color: T.textMuted,
          fontSize: "10px",
          margin: 0,
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {label}
      </p>
    </div>
  );
}
