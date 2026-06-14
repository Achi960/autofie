import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { playMessageBeep } from "@/lib/presence";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let alive = true;

    const refresh = async () => {
      const { count: c } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      if (alive) setCount(c ?? 0);
    };
    refresh();

    // Ask for browser notification permission once
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const m = payload.new as { content: string | null; attachment_type: string | null };
          setCount((c) => c + 1);
          playMessageBeep();
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
            const body = m.content ?? (m.attachment_type === "image" ? "📷 Photo" : m.attachment_type === "audio" ? "🎙 Voice note" : "New message");
            try { new Notification("New message on AutoFie", { body, icon: "/favicon.ico" }); } catch { /* ignore */ }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => { refresh(); },
      )
      .subscribe();

    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => { alive = false; supabase.removeChannel(channel); document.removeEventListener("visibilitychange", onVisible); };
  }, [user?.id]);

  return count;
}
