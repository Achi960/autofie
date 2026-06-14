import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "dealer_pending" | "dealer_verified" | "admin";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  profile: ProfileRow | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isVerifiedDealer: boolean;
  isPendingDealer: boolean;
  refreshRoles: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((data as any) ?? null);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) Promise.all([loadRoles(u.id), loadProfile(u.id)]).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setTimeout(() => { loadRoles(u.id); loadProfile(u.id); }, 0);
      } else {
        setRoles([]); setProfile(null);
      }
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isVerifiedDealer: roles.includes("dealer_verified"),
    isPendingDealer: roles.includes("dealer_pending"),
    refreshRoles: async () => { if (user) await loadRoles(user.id); },
    refreshProfile: async () => { if (user) await loadProfile(user.id); },
    signOut: async () => { await supabase.auth.signOut(); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
