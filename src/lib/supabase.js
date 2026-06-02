import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nibdvppatasucybzfzet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYmR2cHBhdGFzdWN5YnpmemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDI1NTUsImV4cCI6MjA5NDUxODU1NX0.H4lPCHC-bdlrf1JEXzWd1x-kzHeSdpFq6UFIepjhGUk";

const pumpiStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    } catch {}
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {}
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

function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(label)), ms)
  );

  return Promise.race([promise, timeout]);
}

export async function saveSessionToSupabase(session, uid) {
  if (!uid) throw new Error("Usuário não autenticado");

  const normalizedId = Number(session.id);

  const payload = {
    id: normalizedId,
    user_id: uid,
    data: {
      ...session,
      id: normalizedId,
      updatedAt: session.updatedAt || Date.now(),
    },
  };

  const result = await withTimeout(
    supabase
      .from("sessions")
      .upsert(payload, { onConflict: "id" })
      .select("id,user_id")
      .single(),
    6000,
    "timeout_save_session"
  );

  if (result.error) throw result.error;

  return result.data;
}

export async function saveWithRetry(session, uid, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      await saveSessionToSupabase(session, uid);
      return true;
    } catch (error) {
      console.error(`saveWithRetry tentativa ${i + 1} falhou:`, {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    }
  }

  return false;
}

export async function deleteSessionFromSupabase(id, uid) {
  if (!uid) throw new Error("Usuário não autenticado");

  const result = await withTimeout(
    supabase
      .from("sessions")
      .delete()
      .eq("id", Number(id))
      .eq("user_id", uid),
    6000,
    "timeout_delete_session"
  );

  if (result.error) throw result.error;

  return true;
}

export async function deleteWithRetry(id, uid, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      await deleteSessionFromSupabase(id, uid);
      return true;
    } catch (error) {
      console.error(`deleteWithRetry tentativa ${i + 1} falhou:`, {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    }
  }

  return false;
}
