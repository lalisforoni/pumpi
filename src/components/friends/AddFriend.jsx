import { useState } from "react";

export default function AddFriend({
  theme,
  suggestions,
  onSearch,
  onSendRequest,
}) {
  const T = theme;

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const searchUser = async () => {
    if (!searchEmail.trim()) return;

    setSearching(true);
    setSearchResult(null);

    const result = await onSearch(searchEmail);

    setSearchResult(result || "not_found");
    setSearching(false);
  };

  const sendRequest = async (profile) => {
    await onSendRequest(profile.id);
    setSearchEmail("");
    setSearchResult(null);
  };

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
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          placeholder="email@exemplo.com"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchUser();
          }}
          style={{
            flex: 1,
            background: T.inputBg,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: "12px",
            color: T.text,
            fontSize: "14px",
            padding: "11px 14px",
            fontFamily: "'DM Sans',sans-serif",
            outline: "none",
          }}
        />

        <button
          onClick={searchUser}
          disabled={searching}
          style={{
            background: T.accent,
            border: "none",
            borderRadius: "12px",
            color: T.accentText,
            fontWeight: 800,
            padding: "11px 16px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            opacity: searching ? 0.7 : 1,
          }}
        >
          {searching ? "..." : "Buscar"}
        </button>
      </div>

      {searchResult && searchResult !== "not_found" && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  color: T.text,
                  fontWeight: 800,
                  fontSize: "14px",
                  margin: 0,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                @{searchResult.username}
              </p>

              <p
                style={{
                  color: T.textMuted,
                  fontSize: "12px",
                  margin: "2px 0 0",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {searchResult.email}
              </p>
            </div>

            <button
              onClick={() => sendRequest(searchResult)}
              style={{
                background: T.accent,
                border: "none",
                borderRadius: "12px",
                color: T.accentText,
                fontWeight: 800,
                fontSize: "12px",
                padding: "8px 14px",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Adicionar
            </button>
          </div>
        </Card>
      )}

      {searchResult === "not_found" && (
        <p
          style={{
            color: T.textMuted,
            fontSize: "13px",
            fontFamily: "'DM Sans',sans-serif",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Usuária não encontrada.
        </p>
      )}

      {suggestions.length > 0 && !searchResult && (
        <>
          <SectionLabel>Usuárias no PUMPI</SectionLabel>

          {suggestions.map((suggestion) => (
            <Card key={suggestion.id}>
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
                      width: "34px",
                      height: "34px",
                      background: `${T.accent}18`,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    🍑
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        color: T.text,
                        fontWeight: 800,
                        fontSize: "13px",
                        margin: 0,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      @{suggestion.username}
                    </p>

                    <p
                      style={{
                        color: T.textMuted,
                        fontSize: "11px",
                        margin: "2px 0 0",
                        fontFamily: "'DM Sans',sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {suggestion.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => sendRequest(suggestion)}
                  style={{
                    background: T.accent,
                    border: "none",
                    borderRadius: "12px",
                    color: T.accentText,
                    fontWeight: 800,
                    fontSize: "12px",
                    padding: "7px 12px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Add
                </button>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
