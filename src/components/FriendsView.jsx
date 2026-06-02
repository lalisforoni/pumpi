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
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    let alive = true;
    if (user?.id) loadFriends(alive);
    else setLoadingFriends(false);
    return () => { alive = false; };
  }, [user?.id]);

  const loadFriends = async (alive = true) => {
    setLoadingFriends(true);
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
      const fetchPromise = async () => {
        const uid = user?.id;
        if (!uid) return;

        const { data: reqs, error: reqsError } = await supabase
          .from("friendships").select("*")
          .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);
        if (reqsError) throw reqsError;

        const { data: allProfiles } = await supabase
          .from("profiles").select("id,username,email")
          .neq("id", uid).limit(50);

        const getProfile = id => (allProfiles || []).find(p => p.id === id);

        if (reqs && reqs.length > 0) {
          const accepted = reqs.filter(r => r.status === "accepted").map(r => {
            const otherId = r.requester_id === uid ? r.receiver_id : r.requester_id;
            const prof = getProfile(otherId);
            return { id: otherId, username: prof?.username || prof?.email || "?", friendshipId: r.id };
          });
          const pend = reqs.filter(r => r.status === "pending" && r.receiver_id === uid).map(r => ({
            ...r, requesterUsername: getProfile(r.requester_id)?.username || "?",
          }));
          const sentReqs = reqs.filter(r => r.status === "pending" && r.requester_id === uid).map(r => ({
            ...r, receiverUsername: getProfile(r.receiver_id)?.username || "?",
          }));
          const usedIds = [uid, ...reqs.map(r => r.requester_id === uid ? r.receiver_id : r.requester_id)];

          if (alive) { setFriends(accepted); setPending(pend); setSent(sentReqs); setSuggestions((allProfiles || []).filter(p => !usedIds.includes(p.id))); }
        } else {
          if (alive) { setFriends([]); setPending([]); setSent([]); setSuggestions(allProfiles || []); }
        }

        const { data: bts } = await supabase.from("battles").select("*")
          .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`).eq("status", "active");
        if (alive && bts) setBattles(bts);
      };

      await Promise.race([fetchPromise(), timeoutPromise]);
    } catch (e) {
      console.error("loadFriends falhou:", e.message);
    } finally {
      if (alive) setLoadingFriends(false);
    }
  };

  const searchUser = async () => {
    setSearching(true); setSearchResult(null);
    try {
      const { data } = await supabase.from("profiles").select("id,username,email")
        .eq("email", searchEmail.trim().toLowerCase()).neq("id", user?.id).maybeSingle();
      setSearchResult(data || "not_found");
    } catch { setSearchResult("not_found"); }
    setSearching(false);
  };

  const sendRequest = async (receiverId) => {
    try {
      await supabase.from("friendships").insert({ requester_id: user?.id, receiver_id: receiverId, status: "pending" });
      setSearchEmail(""); setSearchResult(null);
      await loadFriends();
    } catch (e) { alert("Erro ao enviar pedido: " + e.message); }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
      await loadFriends();
    } catch (e) { alert("Erro ao aceitar: " + e.message); }
  };

  const createBattle = async (opponentId, type) => {
    try {
      const ends = new Date(); ends.setDate(ends.getDate() + 7);
      await supabase.from("battles").insert({ challenger_id: user?.id, opponent_id: opponentId, type, status: "active", ends_at: ends.toISOString() });
      setSelectedFriend(null);
      await loadFriends();
    } catch (e) { alert("Erro ao criar batalha: " + e.message); }
  };

  const myStreak = () => {
    const done = sessions.filter(s => s.status === "done");
    const days = [...new Set(done.map(s => s.date.slice(0, 10)))].sort();
    if (!days.length) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (days[days.length - 1] !== today && days[days.length - 1] !== yesterday) return 0;
    let streak = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      const d = (new Date(days[i + 1]) - new Date(days[i])) / (1000 * 60 * 60 * 24);
      if (d === 1) streak++; else break;
    }
    return streak;
  };

  const myLower = sessions.reduce((a, s) => a + (s.lower?.length || 0), 0);
  const Card = ({ children, style = {} }) => (
    <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "14px", padding: "14px", marginBottom: "10px", ...style }}>
      {children}
    </div>
  );

  if (loadingFriends) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.pumpi-spin{animation:spin 1s linear infinite;display:inline-block;}`}</style>
      <span className="pumpi-spin" style={{ fontSize: "32px" }}>🍑</span>
      <p style={{ color: T.textSub, fontSize: "13px", fontFamily: "'DM Sans',sans-serif", marginTop: "12px" }}>Carregando amigos...</p>
    </div>
  );

  const battleTypes = [
    { id: "streak", label: "🔥 Batalha de Streak", desc: "Quem mantém mais dias seguidos em 7 dias" },
    { id: "lower", label: "🍑 Batalha do Fundão", desc: "Quem faz mais exercícios lower em 7 dias" },
    { id: "total", label: "💪 Batalha Total", desc: "Quem treina mais vezes em 7 dias" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", background: T.bgCard, borderRadius: "12px", padding: "3px", marginBottom: "16px", border: `1px solid ${T.bgCardBorder}` }}>
        {["friends", "battles", "add"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: "8px", background: tab === t ? T.accent : "transparent", border: "none", borderRadius: "8px", color: tab === t ? T.accentText : T.textSub, fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {t === "friends" ? `Amigos${pending.length > 0 ? ` (${pending.length})` : ""}` : t === "battles" ? "Batalhas" : "+ Adicionar"}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div>
          {pending.length > 0 && (
            <>
              <p style={{ color: T.textMuted, fontSize: "11px", fontFamily: "'DM Sans',sans-serif", margin: "0 0 8px", letterSpacing: "1.5px" }}>PEDIDOS PENDENTES</p>
              {pending.map(p => (
                <Card key={p.id} style={{ border: `1px solid ${T.accent}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: T.text, fontSize: "14px", fontWeight: 600, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>@{p.requesterUsername}</p>
                    <button onClick={() => acceptRequest(p.id)} style={{ background: T.green, border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, fontSize: "13px", padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✓ Aceitar</button>
                  </div>
                </Card>
              ))}
              <div style={{ height: "1px", background: T.divider, margin: "8px 0 16px" }} />
            </>
          )}

          {sent.length > 0 && (
            <>
              <p style={{ color: T.textMuted, fontSize: "11px", fontFamily: "'DM Sans',sans-serif", margin: "0 0 8px", letterSpacing: "1.5px" }}>PEDIDOS ENVIADOS</p>
              {sent.map(p => (
                <Card key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: T.text, fontSize: "13px", fontWeight: 600, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>@{p.receiverUsername}</p>
                    <span style={{ color: T.textMuted, fontSize: "11px", fontFamily: "'DM Sans',sans-serif" }}>Aguardando...</span>
                  </div>
                </Card>
              ))}
              <div style={{ height: "1px", background: T.divider, margin: "8px 0 16px" }} />
            </>
          )}

          {friends.length === 0 && sent.length === 0 && pending.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: "40px", marginBottom: "12px" }}>👯</p>
              <p style={{ color: T.textSub, fontSize: "14px", fontFamily: "'DM Sans',sans-serif" }}>Ainda sem amigos.<br />Adicione alguém na aba "+ Adicionar"!</p>
            </div>
          ) : friends.map(f => (
            <Card key={f.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", background: `${T.accent}20`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🍑</div>
                  <p style={{ color: T.text, fontWeight: 700, fontSize: "14px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>@{f.username}</p>
                </div>
                <button onClick={() => setSelectedFriend(f)} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "8px", color: T.accent, fontSize: "12px", padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>⚔️ Desafiar</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "add" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input placeholder="email@exemplo.com" value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
              style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.text, fontSize: "14px", padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
            <button onClick={searchUser} disabled={searching}
              style={{ background: T.accent, border: "none", borderRadius: "10px", color: T.accentText, fontWeight: 700, padding: "10px 16px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              {searching ? "..." : "Buscar"}
            </button>
          </div>

          {searchResult && searchResult !== "not_found" && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: T.text, fontWeight: 600, fontSize: "14px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>@{searchResult.username}</p>
                  <p style={{ color: T.textMuted, fontSize: "12px", margin: "2px 0 0", fontFamily: "'DM Sans',sans-serif" }}>{searchResult.email}</p>
                </div>
                <button onClick={() => sendRequest(searchResult.id)} style={{ background: T.accent, border: "none", borderRadius: "10px", color: T.accentText, fontWeight: 700, fontSize: "13px", padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Adicionar 🍑</button>
              </div>
            </Card>
          )}

          {searchResult === "not_found" && <p style={{ color: T.textMuted, fontSize: "13px", fontFamily: "'DM Sans',sans-serif", textAlign: "center", marginBottom: "16px" }}>Usuário não encontrado 😕</p>}

          {suggestions.length > 0 && !searchResult && (
            <>
              <p style={{ color: T.textMuted, fontSize: "11px", fontFamily: "'DM Sans',sans-serif", margin: "8px 0", letterSpacing: "1.5px" }}>USUÁRIOS NO PUMPI</p>
              {suggestions.map(s => (
                <Card key={s.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", background: `${T.accent}20`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🍑</div>
                      <div>
                        <p style={{ color: T.text, fontWeight: 600, fontSize: "13px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>@{s.username}</p>
                        <p style={{ color: T.textMuted, fontSize: "11px", margin: "2px 0 0", fontFamily: "'DM Sans',sans-serif" }}>{s.email}</p>
                      </div>
                    </div>
                    <button onClick={() => sendRequest(s.id)} style={{ background: T.accent, border: "none", borderRadius: "10px", color: T.accentText, fontWeight: 700, fontSize: "12px", padding: "7px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Add</button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "battles" && (
        <div>
          <Card style={{ border: `1px solid ${T.accent}30`, marginBottom: "16px" }}>
            <p style={{ color: T.textMuted, fontSize: "10px", letterSpacing: "1.5px", fontFamily: "'DM Sans',sans-serif", margin: "0 0 8px" }}>MEU STATUS</p>
            <div style={{ display: "flex", gap: "16px" }}>
              <div><p style={{ color: T.accent, fontSize: "20px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace" }}>{myStreak()}🔥</p><p style={{ color: T.textMuted, fontSize: "10px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>streak</p></div>
              <div><p style={{ color: "#e879f9", fontSize: "20px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace" }}>{myLower}🍑</p><p style={{ color: T.textMuted, fontSize: "10px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>lower total</p></div>
              <div><p style={{ color: T.green, fontSize: "20px", fontWeight: 800, margin: 0, fontFamily: "'DM Mono',monospace" }}>{sessions.filter(s => s.status === "done").length}💪</p><p style={{ color: T.textMuted, fontSize: "10px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>treinos</p></div>
            </div>
          </Card>

          {battles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: "40px", marginBottom: "12px" }}>⚔️</p>
              <p style={{ color: T.textSub, fontSize: "14px", fontFamily: "'DM Sans',sans-serif" }}>Nenhuma batalha ativa.<br />Desafie uma amiga!</p>
            </div>
          ) : battles.map(b => (
            <Card key={b.id} style={{ border: `1px solid ${T.accent}25` }}>
              <p style={{ color: T.accent, fontSize: "12px", fontWeight: 700, margin: "0 0 4px", fontFamily: "'DM Sans',sans-serif" }}>
                {b.type === "streak" ? "🔥 Batalha de Streak" : b.type === "lower" ? "🍑 Batalha do Fundão" : "💪 Batalha Total"}
              </p>
              <p style={{ color: T.textMuted, fontSize: "11px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>Termina em {new Date(b.ends_at).toLocaleDateString("pt-BR")}</p>
            </Card>
          ))}
        </div>
      )}

      {selectedFriend && (
        <div onClick={() => setSelectedFriend(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.bgCardBorder}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: "480px" }}>
            <div style={{ width: "36px", height: "4px", background: `${T.accent}40`, borderRadius: "2px", margin: "0 auto 20px" }} />
            <p style={{ color: T.text, fontSize: "16px", fontWeight: 700, fontFamily: "'DM Sans',sans-serif", marginBottom: "16px" }}>⚔️ Desafiar @{selectedFriend.username}</p>
            {battleTypes.map(bt => (
              <button key={bt.id} onClick={() => createBattle(selectedFriend.id, bt.id)}
                style={{ width: "100%", background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "12px", padding: "14px", marginBottom: "8px", cursor: "pointer", textAlign: "left" }}>
                <p style={{ color: T.text, fontSize: "13px", fontWeight: 700, margin: "0 0 2px", fontFamily: "'DM Sans',sans-serif" }}>{bt.label}</p>
                <p style={{ color: T.textMuted, fontSize: "11px", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{bt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
