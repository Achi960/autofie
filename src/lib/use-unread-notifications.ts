import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useUnreadNotifications() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let alive = true;

    const refresh = async () => {
      const { count: c } = await supabase
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (alive) setCount(c ?? 0);
    };
    refresh();

    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        () => setCount((c) => c + 1),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        () => { refresh(); },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        () => { refresh(); },
      )
      .subscribe();

    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => { alive = false; supabase.removeChannel(channel); document.removeEventListener("visibilitychange", onVisible); };
  }, [user?.id]);

  return count;
}
