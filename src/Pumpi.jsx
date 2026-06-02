import { useState, useEffect, useRef } from "react";
import { supabase, saveWithRetry, deleteWithRetry } from "./lib/supabase";
import { STORAGE_KEY, PENDING_KEY, getDeletedSessionIds, addDeletedSessionId, removeDeletedSessionId, mergeSessions, sortSessions } from "./lib/storage";
import { getTimeTheme } from "./lib/themes";
import { calcDuration } from "./lib/utils";

import LoginScreen from "./components/LoginScreen";
import SessionView from "./components/SessionView";
import FriendsView from "./components/FriendsView";
import MetricsView from "./components/MetricsView";
import ProfileView from "./components/ProfileView";
import ManualSessionModal from "./components/ManualSessionModal";
import CelebrationModal from "./components/CelebrationModal";

export default function Pumpi() {
  const [data, setData] = useState({ sessions: [] });
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [tab, setTab] = useState("home");
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState(getTimeTheme());
  const [celebration, setCelebration] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const touchStartY = useRef(0);
  const T = theme;

  // Atualiza tema a cada minuto
  useEffect(() => {
    const id = setInterval(() => setTheme(getTimeTheme()), 60000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh a cada 5 min (fora da sessão ativa)
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (tab !== "session") loadData(user.id);
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [user, tab]);

  // Init
  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;
        if (session?.user) {
          setUser(session.user);
          await loadData(session.user.id);
        } else {
          const s = localStorage.getItem(STORAGE_KEY);
          if (s) setData(JSON.parse(s));
        }
      } catch (e) {
        console.error("Init falhou:", e?.message);
        try { const s = localStorage.getItem(STORAGE_KEY); if (s) setData(JSON.parse(s)); } catch {}
      } finally {
        if (alive) setLoaded(true);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) { setUser(session.user); await loadData(session.user.id); }
      if (event === "SIGNED_OUT") { setUser(null); setProfile(null); setData({ sessions: [] }); setPendingCount(0); }
    });

    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  // ── Data ──────────────────────────────────────────────────
  const loadData = async (uid) => {
    try {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (prof) setProfile(prof);

      const local = localStorage.getItem(STORAGE_KEY);
      const localSessions = local ? JSON.parse(local).sessions || [] : [];
      const deletedIds = getDeletedSessionIds();
      const visibleLocal = localSessions.filter(s => !deletedIds.includes(String(s.id)));

      const { data: rows, error } = await supabase.from("sessions").select("*").eq("user_id", uid).order("id", { ascending: false });
      if (error) throw error;

      const remote = (rows || []).map(r => ({ ...r.data, id: r.id, updatedAt: r.updated_at ? Date.parse(r.updated_at) : r.id }));
      const merged = mergeSessions(
        remote.filter(s => !deletedIds.includes(String(s.id))),
        visibleLocal
      );

      setData({ sessions: merged });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions: merged }));

      const { data: pend } = await supabase.from("friendships").select("*").eq("receiver_id", uid).eq("status", "pending");
      if (pend) setPendingCount(pend.length);

      // Sync pendentes offline
      try {
        const pendingSync = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]").map(String);
        if (pendingSync.length > 0) {
          for (const id of pendingSync) {
            const s = merged.find(s => String(s.id) === id);
            if (s) await saveWithRetry(s, uid);
          }
          localStorage.removeItem(PENDING_KEY);
        }
      } catch {}
    } catch (e) {
      console.error("loadData falhou:", e);
      try { const s = localStorage.getItem(STORAGE_KEY); if (s) setData(JSON.parse(s)); } catch {}
    }
  };

  // ── Save ─────────────────────────────────────────────────
  const saveSession = async (session, uid = user?.id) => {
    if (!uid) return false;
    setSyncStatus("saving");

    const ok = await saveWithRetry(session, uid);

    if (ok) {
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus(null), 3000);
      try {
        const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]").map(String);
        localStorage.setItem(PENDING_KEY, JSON.stringify(pending.filter(id => id !== String(session.id))));
      } catch {}
      return true;
    }

    setSyncStatus("error");
    setTimeout(() => setSyncStatus(null), 5000); // ✅ erro some após 5s, não fica preso
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]").map(String);
      if (!pending.includes(String(session.id))) {
        localStorage.setItem(PENDING_KEY, JSON.stringify([...pending, String(session.id)]));
      }
    } catch {}

    // Retry automático após 10s
    setTimeout(async () => {
      if (!uid) return;
      const ok2 = await saveWithRetry(session, uid);
      if (ok2) {
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus(null), 3000);
        try {
          const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]").map(String);
          localStorage.setItem(PENDING_KEY, JSON.stringify(pending.filter(id => id !== String(session.id))));
        } catch {}
      }
    }, 10000);

    return false;
  };

  const save = async (nd) => {
    const normalized = { ...nd, sessions: sortSessions(nd.sessions || []) };
    setData(normalized);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch {}
  };

  // ── Session actions ───────────────────────────────────────
  const newSession = async () => {
    const s = { id: Date.now(), date: new Date().toISOString(), status: "pending", startedAt: null, finishedAt: null, lower: [], upper: [] };
    await save({ ...data, sessions: [s, ...data.sessions] });
    setActiveSession(s.id);
    setTab("session");
  };

  const updateSession = async (updated) => {
    const withTs = { ...updated, updatedAt: Date.now() };
    await save({ ...data, sessions: data.sessions.map(s => String(s.id) === String(withTs.id) ? withTs : s) });
    setActiveSession(withTs.id);
  };

  const finishSession = async () => {
    const s = data.sessions.find(s => String(s.id) === String(activeSession));
    if (!s) return;
    const updated = { ...s, status: "done", finishedAt: Date.now(), updatedAt: Date.now() };
    await save({ ...data, sessions: data.sessions.map(item => String(item.id) === String(activeSession) ? updated : item) });
    setCelebration(true);
    saveSession(updated); // fire-and-forget
  };

  const deleteSession = async (id) => {
    addDeletedSessionId(id);
    await save({ ...data, sessions: data.sessions.filter(s => String(s.id) !== String(id)) });
    setTab("home");
    if (user) {
      setSyncStatus("saving");
      const ok = await deleteWithRetry(id, user.id);
      if (ok) { removeDeletedSessionId(id); setSyncStatus("saved"); setTimeout(() => setSyncStatus(null), 3000); }
      else { setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 5000); }
    }
  };

  const saveManualSession = async (session) => {
    await save({ ...data, sessions: [session, ...data.sessions] });
    setShowManual(false);
    setActiveSession(null);
    setTab("home");
    saveSession(session);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setData({ sessions: [] }); setPendingCount(0);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.race([
        user?.id ? loadData(user.id) : Promise.resolve(),
        new Promise(resolve => setTimeout(() => resolve("timeout"), 8000)),
      ]);
    } catch (e) { console.error("Refresh falhou:", e); }
    finally { setRefreshing(false); }
  };

  // ── Helpers ───────────────────────────────────────────────
  const currentSession = data.sessions.find(s => s.id === activeSession);
  const totalEx = s => (s.lower?.length || 0) + (s.upper?.length || 0);

  const statusBadge = s => {
    if (s.status === "done") return { label: "✅ Finalizado", color: T.green, bg: `${T.green}18` };
    if (s.status === "active") return { label: "🔥 Em andamento", color: T.accent, bg: `${T.accent}18` };
    return { label: "⏸ Não iniciado", color: T.textMuted, bg: T.bgCard };
  };

  // ── Sync badge ────────────────────────────────────────────
  const sync = syncStatus === "saving"
    ? { icon: "🍑", label: "Salvando...", bg: `${T.accent}18`, color: T.accent, spin: true }
    : syncStatus === "saved"
    ? { icon: "✓", label: "Sincronizado", bg: `${T.green}18`, color: T.green, spin: false }
    : syncStatus === "error"
    ? { icon: "!", label: "Erro ao salvar", bg: `${T.danger}18`, color: T.danger, spin: false }
    : null; // ✅ null = não mostra nada quando offline/sem status

  // ── Loading ───────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.pumpi-spin{animation:spin 1s linear infinite;display:inline-block;}`}</style>
      <span className="pumpi-spin" style={{ fontSize: "48px" }}>🍑</span>
      <p style={{ color: T.accent, fontSize: "13px", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: "1px" }}>Carregando...</p>
    </div>
  );

  if (!user) return <LoginScreen theme={T} onLogin={u => { setUser(u); loadData(u.id); }} />;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", maxWidth: "480px", margin: "0 auto", fontFamily: "'DM Sans',sans-serif", paddingBottom: "80px", transition: "background 2s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{width:100%;height:100%;overflow-x:hidden;}
        input::placeholder{color:${T.textMuted}!important;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input[type=date]{color-scheme:${T.id==="manha"?"light":"dark"};}
        select option{background:${T.modalBg};color:${T.text};}
        textarea{font-family:'DM Sans',sans-serif!important;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:2px;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .pumpi-spin{animation:spin 1s linear infinite;display:inline-block;}
      `}</style>

      {celebration && currentSession && <CelebrationModal theme={T} session={currentSession} onClose={() => setCelebration(false)} />}
      {showManual && <ManualSessionModal theme={T} onSave={saveManualSession} onClose={() => setShowManual(false)} allSessions={data.sessions} />}

      {/* Header */}
      <div style={{ padding: "calc(env(safe-area-inset-top) + 16px) 20px 16px", borderBottom: `1px solid ${T.divider}`, position: "sticky", top: 0, background: T.header, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {tab === "session" ? (
            <button onClick={() => setTab("home")} style={{ background: "none", border: "none", color: T.accent, fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Voltar</button>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "16px" }}>🍑</span>
                <span style={{ color: T.accent, fontSize: "16px", fontWeight: 800, fontFamily: "'DM Sans',sans-serif" }}>Pumpi</span>
                {/* ✅ Sem emoji do tempo */}
                {sync && (
                  <span style={{ marginLeft: "4px", background: sync.bg, color: sync.color, borderRadius: "999px", padding: "3px 8px", fontSize: "10px", fontWeight: 700, fontFamily: "'DM Sans',sans-serif", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span className={sync.spin ? "pumpi-spin" : ""}>{sync.icon}</span>
                    {sync.label}
                  </span>
                )}
              </div>
              <p style={{ color: T.textSub, fontSize: "12px", fontFamily: "'DM Sans',sans-serif" }}>{profile ? `@${profile.username}` : "Progresso de Treino"}</p>
            </div>
          )}

          {tab === "home" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowManual(true)} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "12px", color: T.textSub, fontWeight: 600, fontSize: "12px", padding: "10px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>📅</button>
              <button onClick={newSession} style={{ background: T.accent, border: "none", borderRadius: "12px", color: T.accentText, fontWeight: 700, fontSize: "13px", padding: "10px 16px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Nova</button>
            </div>
          )}

          {tab === "session" && currentSession && (
            <div style={{ textAlign: "right" }}>
              <p style={{ color: T.textSub, fontSize: "11px", fontFamily: "'DM Sans',sans-serif" }}>{new Date(currentSession.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
              <p style={{ color: T.textMuted, fontSize: "10px", marginTop: "2px", fontFamily: "'DM Sans',sans-serif" }}>{totalEx(currentSession)} exercícios</p>
            </div>
          )}
        </div>
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div style={{ textAlign: "center", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span className="pumpi-spin" style={{ fontSize: "18px" }}>🍑</span>
          <span style={{ color: T.accent, fontSize: "13px", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Atualizando...</span>
        </div>
      )}

      {/* Main content */}
      <div
        style={{ padding: "20px" }}
        onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={e => {
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          if (dy > 80 && tab !== "session" && !refreshing) { touchStartY.current = 0; handleRefresh(); }
        }}
      >
        {/* HOME */}
        {tab === "home" && (
          data.sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🍑</div>
              <p style={{ color: T.textSub, fontSize: "14px", lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif" }}>Bem-vinda ao Pumpi!<br />Toque em "+ Nova" para começar.</p>
            </div>
          ) : sortSessions(data.sessions).map(s => {
            const total = totalEx(s), badge = statusBadge(s), dur = calcDuration(s.startedAt, s.finishedAt);
            return (
              <div key={s.id} onClick={() => { setActiveSession(s.id); setTab("session"); }}
                style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "16px", padding: "16px", marginBottom: "10px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: total > 0 ? "10px" : "0" }}>
                  <div>
                    <p style={{ color: T.text, fontWeight: 600, fontSize: "15px", fontFamily: "'DM Sans',sans-serif" }}>
                      {new Date(s.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                    </p>
                    <p style={{ color: T.textSub, fontSize: "12px", marginTop: "3px", fontFamily: "'DM Sans',sans-serif" }}>
                      {s.lower?.length || 0} lower · {s.upper?.length || 0} upper{dur ? ` · ${dur}` : ""}{s.manual ? " · manual" : ""}
                    </p>
                  </div>
                  <span style={{ background: badge.bg, color: badge.color, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                    {badge.label}
                  </span>
                </div>
                {total > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {[...(s.lower || []), ...(s.upper || [])].slice(0, 4).map((ex, i) => (
                      <span key={i} style={{ background: T.bgCard, border: `1px solid ${T.bgCardBorder}`, borderRadius: "6px", padding: "3px 8px", color: T.textSub, fontSize: "11px", fontFamily: "'DM Sans',sans-serif" }}>
                        {ex.machine}{ex.weight ? ` · ${ex.weight}kg` : ""}
                      </span>
                    ))}
                    {total > 4 && <span style={{ color: T.textMuted, fontSize: "11px", padding: "3px 0", fontFamily: "'DM Sans',sans-serif" }}>+{total - 4} mais</span>}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* SESSION */}
        {tab === "session" && currentSession && (
          <>
            <SessionView session={currentSession} onUpdate={updateSession} onSave={saveSession} theme={T} onFinish={finishSession} data={data.sessions} />
            <div style={{ marginTop: "24px", display: "grid", gap: "10px" }}>
              {currentSession.status === "pending" && (
                <button onClick={() => updateSession({ ...currentSession, status: "active", startedAt: Date.now() })}
                  style={{ background: T.accent, border: "none", borderRadius: "14px", color: T.accentText, fontWeight: 800, fontSize: "15px", padding: "15px", width: "100%", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: `0 4px 16px ${T.accent}35` }}>
                  Começar treino 🍑
                </button>
              )}
              {currentSession.status === "active" && (
                <button onClick={finishSession}
                  style={{ background: T.green, border: "none", borderRadius: "14px", color: "#fff", fontWeight: 800, fontSize: "15px", padding: "15px", width: "100%", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: `0 4px 16px ${T.green}35` }}>
                  Finalizar seu treino 🍑
                </button>
              )}
              {currentSession.status === "done" && (
                <>
                  <button onClick={() => setTab("home")}
                    style={{ background: T.accent, border: "none", borderRadius: "14px", color: T.accentText, fontWeight: 800, fontSize: "15px", padding: "15px", width: "100%", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    Voltar para meus treinos
                  </button>
                  <button onClick={() => deleteSession(currentSession.id)}
                    style={{ background: "transparent", border: `1px solid ${T.danger}30`, borderRadius: "12px", color: T.danger, fontSize: "13px", padding: "12px", width: "100%", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: 0.65 }}>
                    Excluir sessão
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {tab === "metrics" && <div style={{ paddingBottom: "100px" }}><MetricsView sessions={data.sessions} theme={T} /></div>}
        {tab === "friends" && <div style={{ paddingBottom: "100px" }}><FriendsView theme={T} user={user} sessions={data.sessions} /></div>}
        {tab === "profile" && (
          <div style={{ paddingBottom: "100px" }}>
            <ProfileView profile={profile} sessions={data.sessions} theme={T} onLogout={logout} user={user} syncStatus={syncStatus} />
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      {tab !== "session" && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: T.header, borderTop: `1px solid ${T.divider}`, display: "flex", zIndex: 20, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[
            { id: "home", label: "Treinos", icon: "🏠" },
            { id: "friends", label: "Amigos", icon: "👯", badge: pendingCount },
            { id: "metrics", label: "Métricas", icon: "📊" },
            { id: "profile", label: "Perfil", icon: "👤" },
          ].map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ flex: 1, padding: "14px 0 18px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <span style={{ fontSize: "20px" }}>{n.icon}</span>
                {n.badge > 0 && (
                  <span style={{ position: "absolute", top: "-4px", right: "-8px", background: "#ff6b6b", color: "#fff", fontSize: "9px", fontWeight: 800, padding: "1px 5px", borderRadius: "10px", fontFamily: "'DM Sans',sans-serif" }}>
                    {n.badge}
                  </span>
                )}
              </div>
              <span style={{ color: tab === n.id ? T.accent : T.textMuted, fontSize: "10px", fontWeight: tab === n.id ? 700 : 400, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.5px" }}>
                {n.label}
              </span>
              {tab === n.id && <div style={{ width: "20px", height: "2px", background: T.accent, borderRadius: "1px" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
