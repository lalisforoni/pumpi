import { useEffect, useState } from "react";

import {
  acceptFriendRequest,
  createBattleRequest,
  loadFriendsData,
  loadUserSessions,
  searchProfileByEmail,
  sendFriendRequest,
} from "../lib/friendsApi";

import { getFriendsCache, saveFriendsCache } from "../lib/storage";

import FriendsList from "./friends/FriendsList";
import AddFriend from "./friends/AddFriend";
import BattlesView from "./friends/BattlesView";
import BattleModal from "./friends/BattleModal";

export default function FriendsView({ theme, user, sessions }) {
  const T = theme;

  const [tab, setTab] = useState("friends");

  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [battles, setBattles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [loading, setLoading] = useState(false);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [battleDetail, setBattleDetail] = useState(null);
  const [loadingBattle, setLoadingBattle] = useState(false);

  useEffect(() => {
    const cached = getFriendsCache();

    if (cached && (!cached.userId || cached.userId === user?.id)) {
      setFriends(cached.friends || []);
      setPending(cached.pending || []);
      setSent(cached.sent || []);
      setBattles(cached.battles || []);
      setSuggestions(cached.suggestions || []);
    }
  }, [user?.id]);

  useEffect(() => {
    let alive = true;

    if (user?.id) {
      refreshFriends(alive);
    }

    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        refreshFriends();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id]);

  const refreshFriends = async (alive = true) => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const result = await loadFriendsData(user.id);

      if (!alive) return;

      const cachedResult = {
        ...result,
        userId: user.id,
      };

      setFriends(result.friends || []);
      setPending(result.pending || []);
      setSent(result.sent || []);
      setBattles(result.battles || []);
      setSuggestions(result.suggestions || []);

      saveFriendsCache(cachedResult);
    } catch (error) {
      console.error("refreshFriends falhou:", error.message);

      const cached = getFriendsCache();

      if (cached && (!cached.userId || cached.userId === user?.id)) {
        setFriends(cached.friends || []);
        setPending(cached.pending || []);
        setSent(cached.sent || []);
        setBattles(cached.battles || []);
        setSuggestions(cached.suggestions || []);
      }
    } finally {
      if (alive) setLoading(false);
    }
  };

  const handleSearch = async (email) => {
    try {
      return await searchProfileByEmail(email, user?.id);
    } catch {
      return null;
    }
  };

  const handleSendRequest = async (receiverId) => {
    try {
      const { error } = await sendFriendRequest(user?.id, receiverId);
      if (error) throw error;

      await refreshFriends();
    } catch (error) {
      alert("Erro ao enviar pedido: " + error.message);
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      const { error } = await acceptFriendRequest(friendshipId);
      if (error) throw error;

      await refreshFriends();
    } catch (error) {
      alert("Erro ao aceitar: " + error.message);
    }
  };

  const handleCreateBattle = async (opponentId, type) => {
    try {
      const { error } = await createBattleRequest(user?.id, opponentId, type);
      if (error) throw error;

      setSelectedFriend(null);
      setTab("battles");

      await refreshFriends();
    } catch (error) {
      alert("Erro ao criar comparação: " + error.message);
    }
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

    for (let index = 1; index < days.length; index++) {
      const diff =
        (new Date(days[index]) - new Date(days[index - 1])) /
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

  const openBattle = async (battle, friend) => {
    setSelectedBattle(battle);
    setBattleDetail(null);
    setLoadingBattle(true);

    try {
      const friendSessions = await loadUserSessions(friend.id);

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
    } catch (error) {
      console.error("openBattle falhou:", error.message);

      setBattleDetail({
        error:
          "Não consegui carregar os dados do seu amigo. Verifique as permissões da tabela sessions no Supabase.",
      });
    } finally {
      setLoadingBattle(false);
    }
  };

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

  const Card = ({ children }) => (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "16px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  );

  const hasAnyFriendData =
    friends.length > 0 ||
    pending.length > 0 ||
    sent.length > 0 ||
    battles.length > 0;

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
              ? `Amigos${pending.length > 0 ? ` (${pending.length})` : ""}`
              : item === "battles"
              ? "Progresso"
              : "Adicionar"}
          </button>
        ))}
      </div>

      {loading && !hasAnyFriendData && (
        <Card>
          <p
            style={{
              color: T.textSub,
              fontSize: "13px",
              fontFamily: "'DM Sans',sans-serif",
              margin: 0,
            }}
          >
            Carregando amigos...
          </p>
        </Card>
      )}

      {tab === "friends" && (
        <FriendsList
          theme={T}
          friends={friends}
          pending={pending}
          sent={sent}
          onAccept={handleAccept}
          onCompare={setSelectedFriend}
        />
      )}

      {tab === "add" && (
        <AddFriend
          theme={T}
          suggestions={suggestions}
          onSearch={handleSearch}
          onSendRequest={handleSendRequest}
        />
      )}

      {tab === "battles" && (
        <BattlesView
          theme={T}
          battles={battles}
          friends={friends}
          sessions={sessions}
          user={user}
          onOpenBattle={openBattle}
        />
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
            onClick={(event) => event.stopPropagation()}
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
                onClick={() =>
                  handleCreateBattle(selectedFriend.id, battleType.id)
                }
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
          theme={T}
          battle={selectedBattle}
          detail={battleDetail}
          loading={loadingBattle}
          onClose={() => {
            setSelectedBattle(null);
            setBattleDetail(null);
          }}
        />
      )}
    </div>
  );
}
