import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function FriendsView({ theme, user, sessions }) {
  const T = theme;

  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [battles, setBattles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const [tab, setTab] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [battleDetail, setBattleDetail] = useState(null);
  const [loadingBattle, setLoadingBattle] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    let alive = true;

    if (user?.id) loadFriends(alive);
    else setLoadingFriends(false);

    return () => {
      alive = false;
    };
  }, [user?.id]);

const loadFriends = async (alive = true) => {
  setLoadingFriends(true);

  try {
    const uid = user?.id;
    if (!uid) {
      if (alive) setLoadingFriends(false);
      return;
    }

    const { data: reqs, error: reqsError } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);

    if (reqsError) throw reqsError;

    const profileIds = [
      ...new Set(
        (reqs || []).flatMap((r) => [
          r.requester_id,
          r.receiver_id,
        ])
      ),
    ].filter((id) => id && id !== uid);

    const { data: profiles } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id,username,email")
          .in("id", profileIds)
      : { data: [] };

    const getProfile = (id) =>
      (profiles || []).find((p) => p.id === id);

    const accepted = (reqs || [])
      .filter((r) => r.status === "accepted")
      .map((r) => {
        const otherId =
          r.requester_id === uid ? r.receiver_id : r.requester_id;

        const prof = getProfile(otherId);

        return {
          id: otherId,
          username: prof?.username || prof?.email || "amiga",
          email: prof?.email || "",
          friendshipId: r.id,
        };
      });

    const pend = (reqs || [])
      .filter((r) => r.status === "pending" && r.receiver_id === uid)
      .map((r) => ({
        ...r,
        requesterUsername:
          getProfile(r.requester_id)?.username ||
          getProfile(r.requester_id)?.email ||
          "amiga",
      }));

    const sentReqs = (reqs || [])
      .filter((r) => r.status === "pending" && r.requester_id === uid)
      .map((r) => ({
        ...r,
        receiverUsername:
          getProfile(r.receiver_id)?.username ||
          getProfile(r.receiver_id)?.email ||
          "amiga",
      }));

    if (alive) {
      setFriends(accepted);
      setPending(pend);
      setSent(sentReqs);
    }

    // Batalhas não podem quebrar a aba amigos
    try {
      const { data: bts } = await supabase
        .from("battles")
        .select("*")
        .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`)
        .eq("status", "active");

      if (alive) setBattles(bts || []);
    } catch (e) {
      console.error("battles falhou:", e.message);
      if (alive) setBattles([]);
    }

    // Sugestões também não podem quebrar a aba
    try {
      const usedIds = [
        uid,
        ...(reqs || []).map((r) =>
          r.requester_id === uid ? r.receiver_id : r.requester_id
        ),
      ];

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id,username,email")
        .neq("id", uid)
        .limit(50);

      if (alive) {
        setSuggestions(
          (allProfiles || []).filter((p) => !usedIds.includes(p.id))
        );
      }
    } catch (e) {
      console.error("suggestions falhou:", e.message);
      if (alive) setSuggestions([]);
    }
  } catch (e) {
    console.error("loadFriends falhou:", e.message);

    if (alive) {
      setFriends([]);
      setPending([]);
      setSent([]);
      setBattles([]);
      setSuggestions([]);
    }
  } finally {
    if (alive) setLoadingFriends(false);
  }
};

  const searchUser = async () => {
    setSearching(true);
    setSearchResult(null);

    try {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,email")
        .eq("email", searchEmail.trim().toLowerCase())
        .neq("id", user?.id)
        .maybeSingle();

      setSearchResult(data || "not_found");
    } catch {
      setSearchResult("not_found");
    }

    setSearching(false);
  };

  const sendRequest = async (receiverId) => {
    try {
      await supabase.from("friendships").insert({
        requester_id: user?.id,
        receiver_id: receiverId,
        status: "pending",
      });

      setSearchEmail("");
      setSearchResult(null);

      await loadFriends();
    } catch (e) {
      alert("Erro ao enviar pedido: " + e.message);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      await loadFriends();
    } catch (e) {
      alert("Erro ao aceitar: " + e.message);
    }
  };

  const createBattle = async (opponentId, type) => {
    try {
      const ends = new Date();
      ends.setDate(ends.getDate() + 7);

      await supabase.from("battles").insert({
        challenger_id: user?.id,
        opponent_id: opponentId,
        type,
        status: "active",
        ends_at: ends.toISOString(),
      });

      setSelectedFriend(null);
      setTab("battles");

      await loadFriends();
    } catch (e) {
      alert("Erro ao criar comparação: " + e.message);
    }
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

  const getBattleUnit = (type) => {
    if (type === "streak") return "dias";
    if (type === "lower") return "exercícios";
    return "treinos";
  };

  const getBattleEmoji = (type) => {
    if (type === "streak") return "🔥";
    if (type === "lower") return "🍑";
    return "💪";
  };

  const getPeriod = (battle) => {
    const end = battle.ends_at ? new Date(battle.ends_at) : new Date();

    const start = battle.created_at
      ? new Date(battle.created_at)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    return { start, end };
  };

  const filterBattleSessions = (list, battle) => {
    const { start, end } = getPeriod(battle);

    return list.filter((session) => {
      if (session.status !== "done") return false;

      const date = new Date(session.date);
      return date >= start && date <= end;
    });
  };

  const calcStreakFromSessions = (list) => {
    const days = [
      ...new Set(
        list
          .filter((session) => session.status === "done")
          .map((session) => session.date?.slice(0, 10))
          .filter(Boolean)
      ),
    ].sort();

    if (!days.length) return 0;

    let best = 1;
    let current = 1;

    for (let i = 1; i < days.length; i++) {
      const diff =
        (new Date(days[i]) - new Date(days[i - 1])) /
        (1000 * 60 * 60 * 24);

      if (diff === 1) current += 1;
      else current = 1;

      if (current > best) best = current;
    }

    return best;
  };

  const calcBattleValue = (type, list) => {
    if (type === "streak") return calcStreakFromSessions(list);

    if (type === "lower") {
      return list.reduce(
        (total, session) => total + (session.lower?.length || 0),
        0
      );
    }

    return list.filter((session) => session.status === "done").length;
  };

  const openBattle = async (battle) => {
    setSelectedBattle(battle);
    setBattleDetail(null);
    setLoadingBattle(true);

    try {
      const friend = getBattleFriend(battle);

      const { data: rows, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", friend.id)
        .order("id", { ascending: false });

      if (error) throw error;

      const friendSessions = (rows || []).map((row) => ({
        ...row.data,
        id: row.id,
      }));

      const myPeriodSessions = filterBattleSessions(sessions, battle);
      const friendPeriodSessions = filterBattleSessions(friendSessions, battle);

      const myValue = calcBattleValue(battle.type, myPeriodSessions);
      const friendValue = calcBattleValue(battle.type, friendPeriodSessions);

      setBattleDetail({
        friend,
        mySessions: myPeriodSessions,
        friendSessions: friendPeriodSessions,
        myValue,
        friendValue,
      });
    } catch (e) {
      console.error("openBattle falhou:", e.message);
      setBattleDetail({
        error:
          "Não consegui carregar os dados da sua amiga. Verifique as permissões da tabela sessions no Supabase.",
      });
    } finally {
      setLoadingBattle(false);
    }
  };

  const myStreak = () => {
    const done = sessions.filter((session) => session.status === "done");
    const days = [...new Set(done.map((s) => s.date.slice(0, 10)))].sort();

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

  const myLower = sessions.reduce(
    (total, session) => total + (session.lower?.length || 0),
    0
  );

  const myDone = sessions.filter((session) => session.status === "done").length;

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

  
  const battleTypes = [
    {
      id: "streak",
      label: "Sequência de treinos",
      desc: "Compara a melhor sequência dentro de 7 dias.",
    },
    {
      id: "lower",
      label: "Lower Body",
      desc: "Compara quem registra mais exercícios lower.",
    },
    {
      id: "total",
      label: "Treinos concluídos",
      desc: "Compara quem finaliza mais treinos.",
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          background: T.bgCard,
          borderRadius: "14px",
          padding: "4px",
          marginBottom: "16px",
          border: `1px solid ${T.bgCardBorder}`,
        }}
      >
        {["friends", "battles", "add"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            style={{
              flex: 1,
              padding: "9px",
              background: tab === item ? T.accent : "transparent",
              border: "none",
              borderRadius: "10px",
              color: tab === item ? T.accentText : T.textSub,
              fontWeight: 800,
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            {item === "friends"
              ? `Amigas${pending.length > 0 ? ` (${pending.length})` : ""}`
              : item === "battles"
              ? "Progresso"
              : "Adicionar"}
          </button>
        ))}
      </div>

      {loadingFriends && (
  <Card>
    <p
      style={{
        color: T.textSub,
        fontSize: "13px",
        fontFamily: "'DM Sans',sans-serif",
        margin: 0,
      }}
    >
      Carregando amigas...
    </p>
  </Card>
)}

      {tab === "friends" && (
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
                      onClick={() => acceptRequest(request.id)}
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
                    onClick={() => setSelectedFriend(friend)}
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
      )}

      {tab === "add" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input
              placeholder="email@exemplo.com"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
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
                  onClick={() => sendRequest(searchResult.id)}
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
                      onClick={() => sendRequest(suggestion.id)}
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
      )}

      {tab === "battles" && (
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
                  onClick={() => openBattle(battle)}
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
      )}

      {selectedFriend && (
        <div
          onClick={() => setSelectedFriend(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.modalBg,
              border: `1px solid ${T.bgCardBorder}`,
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 40px",
              width: "100%",
              maxWidth: "480px",
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
                color: T.text,
                fontSize: "18px",
                fontWeight: 800,
                fontFamily: "'DM Sans',sans-serif",
                marginBottom: "6px",
              }}
            >
              Comparar com @{selectedFriend.username}
            </p>

            <p
              style={{
                color: T.textMuted,
                fontSize: "12px",
                fontFamily: "'DM Sans',sans-serif",
                marginBottom: "16px",
                lineHeight: 1.5,
              }}
            >
              Escolha uma métrica para acompanhar por 7 dias.
            </p>

            {battleTypes.map((battleType) => (
              <button
                key={battleType.id}
                onClick={() => createBattle(selectedFriend.id, battleType.id)}
                style={{
                  width: "100%",
                  background: T.bgCard,
                  border: `1px solid ${T.bgCardBorder}`,
                  borderRadius: "14px",
                  padding: "14px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    color: T.text,
                    fontSize: "13px",
                    fontWeight: 800,
                    margin: "0 0 2px",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {battleType.label}
                </p>

                <p
                  style={{
                    color: T.textMuted,
                    fontSize: "11px",
                    margin: 0,
                    fontFamily: "'DM Sans',sans-serif",
                    lineHeight: 1.4,
                  }}
                >
                  {battleType.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBattle && (
        <BattleModal
          T={T}
          battle={selectedBattle}
          detail={battleDetail}
          loading={loadingBattle}
          onClose={() => {
            setSelectedBattle(null);
            setBattleDetail(null);
          }}
          getBattleTitle={getBattleTitle}
          getBattleEmoji={getBattleEmoji}
          getBattleUnit={getBattleUnit}
          getPeriod={getPeriod}
        />
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

function BattleModal({
  T,
  battle,
  detail,
  loading,
  onClose,
  getBattleTitle,
  getBattleEmoji,
  getBattleUnit,
  getPeriod,
}) {
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
        onClick={(e) => e.stopPropagation()}
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
              <ScoreBox label="Seus registros" value={detail.mySessions.length} T={T} />
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
