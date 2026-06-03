export default function FriendsList({
  theme,
  friends,
  pending,
  sent,
  onAccept,
  onCompare,
}) {
  const T = theme;

  const Card = ({ children, style = {} }) => (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "16px",
        padding: "14px",
        marginBottom: "10px",
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
      {pending.length > 0 && (
        <>
          <SectionLabel>Pedidos pendentes</SectionLabel>

          {pending.map((request) => (
            <Card
              key={request.id}
              style={{ border: `1px solid ${T.accent}30` }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <p
                  style={{
                    color: T.text,
                    fontSize: "14px",
                    fontWeight: 800,
                    margin: 0,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  @{request.requesterUsername}
                </p>

                <button
                  onClick={() => onAccept(request.id)}
                  style={{
                    background: T.green,
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "12px",
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Aceitar
                </button>
              </div>
            </Card>
          ))}

          <div
            style={{
              height: "1px",
              background: T.divider,
              margin: "8px 0 16px",
            }}
          />
        </>
      )}

      {sent.length > 0 && (
        <>
          <SectionLabel>Pedidos enviados</SectionLabel>

          {sent.map((request) => (
            <Card key={request.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    color: T.text,
                    fontSize: "13px",
                    fontWeight: 700,
                    margin: 0,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  @{request.receiverUsername}
                </p>

                <span
                  style={{
                    color: T.textMuted,
                    fontSize: "11px",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Aguardando
                </span>
              </div>
            </Card>
          ))}

          <div
            style={{
              height: "1px",
              background: T.divider,
              margin: "8px 0 16px",
            }}
          />
        </>
      )}

      {friends.length === 0 && sent.length === 0 && pending.length === 0 ? (
        <div style={{ textAlign: "center", padding: "44px 20px" }}>
          <p style={{ fontSize: "42px", marginBottom: "12px" }}>👯</p>

          <p
            style={{
              color: T.textSub,
              fontSize: "14px",
              lineHeight: 1.6,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Ainda sem amigas.
            <br />
            Adicione alguém para comparar progresso.
          </p>
        </div>
      ) : (
        friends.map((friend) => (
          <Card key={friend.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    background: `${T.accent}18`,
                    border: `1px solid ${T.accent}22`,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  🍑
                </div>

                <p
                  style={{
                    color: T.text,
                    fontWeight: 800,
                    fontSize: "14px",
                    margin: 0,
                    fontFamily: "'DM Sans',sans-serif",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  @{friend.username}
                </p>
              </div>

              <button
                onClick={() => onCompare(friend)}
                style={{
                  background: T.bgCard,
                  border: `1px solid ${T.bgCardBorder}`,
                  borderRadius: "999px",
                  color: T.accent,
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Comparar
              </button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
