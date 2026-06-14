import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotificationsPage,
});

type Notif = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

function AdminNotificationsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    let alive = true;
    supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) toast.error(error.message);
        setItems((data ?? []) as Notif[]);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [isAdmin]);

  const markAllRead = async () => {
    const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
    if (error) { toast.error(error.message); return; }
    setItems((p) => p.map((n) => ({ ...n, read: true })));
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-12 text-center text-muted-foreground">Admins only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="page-container py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="page-title">Admin notifications</h1>
            <p className="page-subtitle">Alerts about new listings and dealer activity.</p>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={!items.some((n) => !n.read)}>
            Mark all read
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id} className={`rounded-xl border bg-card p-3 ${n.read ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {n.link && (
                    <a href={n.link} className="text-xs font-medium text-primary hover:underline">
                      Open
                    </a>
                  )}
                  {!n.read && <span className="mt-1 inline-block h-2 w-2 rounded-full bg-destructive" />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
