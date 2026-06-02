import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nibdvppatasucybzfzet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYmR2cHBhdGFzdWN5YnpmemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDI1NTUsImV4cCI6MjA5NDUxODU1NX0.H4lPCHC-bdlrf1JEXzWd1x-kzHeSdpFq6UFIepjhGUk";

const pumpiStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key) || sessionStorage.getItem(key); }
    catch { return null; }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value); sessionStorage.setItem(key, value); }
    catch {}
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); sessionStorage.removeItem(key); }
    catch {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    storageKey: "pumpi_auth",
    storage: pumpiStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

function logSupabaseError(label, error, extra = {}) {
  console.error(label, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
    ...extra,
  });
}

// ✅ Sem .select().single() — evita erro PGRST116
async function saveOnce(session, uid) {
  const normalizedId = Number(session.id);
  const payload = {
    id: normalizedId,
    user_id: uid,
    data: { ...session, id: normalizedId },
  };

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout_save")), 8000)
  );

  const { error } = await Promise.race([
    supabase.from("sessions").upsert(payload, { onConflict: "id" }),
    timeout,
  ]);

  if (error) {
    logSupabaseError("UPSERT falhou", error, { payload });
    throw error;
  }

  return true;
}

export async function saveWithRetry(session, uid, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const ok = await saveOnce(session, uid);
      if (ok) return true;
    } catch (e) {
      logSupabaseError(`Save tentativa ${i + 1}`, e);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return false;
}

export async function deleteWithRetry(id, uid, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await Promise.race([
        supabase.from("sessions").delete().eq("id", id).eq("user_id", uid),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout_delete")), 5000)),
      ]);
      if (!error) return true;
      console.error(`Delete tentativa ${i + 1} falhou:`, error.message);
    } catch (e) {
      console.error(`Delete tentativa ${i + 1} exception:`, e.message);
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  return false;
}
