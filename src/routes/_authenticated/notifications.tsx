import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, UserPlus, Star, Megaphone, Bell } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

const iconFor = (t: string) => {
  if (t === "favorite") return <Heart className="h-4 w-4 text-rose-500" />;
  if (t === "follow") return <UserPlus className="h-4 w-4 text-primary" />;
  if (t === "review") return <Star className="h-4 w-4 text-amber-500" />;
  if (t === "admin") return <Megaphone className="h-4 w-4 text-primary" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
};

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setItems((data ?? []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // mark all as read when page is opened
    if (user) {
      supabase.from("user_notifications").update({ read: true }).eq("user_id", user.id).eq("read", false).then(() => {});
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">Favorites, follows, reviews and updates.</p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!user) return;
                const { error } = await supabase.from("user_notifications").delete().eq("user_id", user.id);
                if (error) { toast.error(error.message); return; }
                setItems([]);
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You have no notifications yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const body = (
                <div className={`flex items-start gap-3 rounded-xl border bg-card p-3 ${n.read ? "" : "ring-1 ring-primary/30"}`}>
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {iconFor(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.read && <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-destructive" />}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? <Link to={n.link as string}>{body}</Link> : body}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
