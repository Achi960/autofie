import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "dealer_pending" | "dealer_verified" | "admin";

interface AuthContextValue {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isVerifiedDealer: boolean;
  isPendingDealer: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) loadRoles(u.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // defer to avoid recursive supabase call inside the callback
        setTimeout(() => loadRoles(u.id), 0);
      } else {
        setRoles([]);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Presence heartbeat — keeps profiles.last_seen_at fresh while a user is active
  useEffect(() => {
    if (!user) return;
    const ping = () => { supabase.rpc("touch_last_seen"); };
    ping();
    const id = setInterval(ping, 45_000);
    const onFocus = () => ping();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [user?.id]);


  const value: AuthContextValue = {
    user,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isVerifiedDealer: roles.includes("dealer_verified"),
    isPendingDealer: roles.includes("dealer_pending"),
    refreshRoles: async () => {
      if (user) await loadRoles(user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
