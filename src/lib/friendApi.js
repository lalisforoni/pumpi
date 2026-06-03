import { supabase } from "./supabase";

function withTimeout(promise, ms = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export async function loadFriendsData(uid) {
  if (!uid) {
    return {
      friends: [],
      pending: [],
      sent: [],
      battles: [],
      suggestions: [],
    };
  }

  const { data: reqs, error: reqsError } = await withTimeout(
    supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
  );

  if (reqsError) throw reqsError;

  const friendshipRows = reqs || [];

  const profileIds = [
    ...new Set(
      friendshipRows.flatMap((r) => [r.requester_id, r.receiver_id])
    ),
  ].filter((id) => id && id !== uid);

  let profiles = [];

  if (profileIds.length > 0) {
    const { data } = await withTimeout(
      supabase
        .from("profiles")
        .select("id,username,email")
        .in("id", profileIds)
    );

    profiles = data || [];
  }

  const getProfile = (id) => profiles.find((p) => p.id === id);

  const friends = friendshipRows
    .filter((r) => r.status === "accepted")
    .map((r) => {
      const otherId = r.requester_id === uid ? r.receiver_id : r.requester_id;
      const prof = getProfile(otherId);

      return {
        id: otherId,
        username: prof?.username || prof?.email || "amiga",
        email: prof?.email || "",
        friendshipId: r.id,
      };
    });

  const pending = friendshipRows
    .filter((r) => r.status === "pending" && r.receiver_id === uid)
    .map((r) => ({
      ...r,
      requesterUsername:
        getProfile(r.requester_id)?.username ||
        getProfile(r.requester_id)?.email ||
        "amiga",
    }));

  const sent = friendshipRows
    .filter((r) => r.status === "pending" && r.requester_id === uid)
    .map((r) => ({
      ...r,
      receiverUsername:
        getProfile(r.receiver_id)?.username ||
        getProfile(r.receiver_id)?.email ||
        "amiga",
    }));

  let battles = [];

  try {
    const { data } = await withTimeout(
      supabase
        .from("battles")
        .select("*")
        .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`)
        .eq("status", "active")
    );

    battles = data || [];
  } catch {
    battles = [];
  }

  let suggestions = [];

  try {
    const usedIds = [
      uid,
      ...friendshipRows.map((r) =>
        r.requester_id === uid ? r.receiver_id : r.requester_id
      ),
    ];

    const { data } = await withTimeout(
      supabase
        .from("profiles")
        .select("id,username,email")
        .neq("id", uid)
        .limit(50)
    );

    suggestions = (data || []).filter((p) => !usedIds.includes(p.id));
  } catch {
    suggestions = [];
  }

  return {
    friends,
    pending,
    sent,
    battles,
    suggestions,
  };
}

export async function searchProfileByEmail(email, uid) {
  const { data } = await withTimeout(
    supabase
      .from("profiles")
      .select("id,username,email")
      .eq("email", email.trim().toLowerCase())
      .neq("id", uid)
      .maybeSingle()
  );

  return data || null;
}

export async function sendFriendRequest(uid, receiverId) {
  return supabase.from("friendships").insert({
    requester_id: uid,
    receiver_id: receiverId,
    status: "pending",
  });
}

export async function acceptFriendRequest(friendshipId) {
  return supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);
}

export async function createBattleRequest(uid, opponentId, type) {
  const ends = new Date();
  ends.setDate(ends.getDate() + 7);

  return supabase.from("battles").insert({
    challenger_id: uid,
    opponent_id: opponentId,
    type,
    status: "active",
    ends_at: ends.toISOString(),
  });
}

export async function loadUserSessions(uid) {
  const { data, error } = await withTimeout(
    supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("id", { ascending: false })
  );

  if (error) throw error;

  return (data || []).map((row) => ({
    ...row.data,
    id: row.id,
  }));
}
