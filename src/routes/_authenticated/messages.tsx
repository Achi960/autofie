import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { initialsOf } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
});

type Thread = {
  listing_id: string | null;
  other_id: string;
  last_message: string;
  last_at: string;
  unread_count: number;
  other_name?: string | null;
  listing_title?: string | null;
};

function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const { data } = await supabase.rpc("list_my_threads");
      const list = (data ?? []) as Thread[];
      if (list.length) {
        const otherIds = Array.from(new Set(list.map((t) => t.other_id)));
        const listingIds = Array.from(new Set(list.map((t) => t.listing_id).filter(Boolean) as string[]));
        const [{ data: profs }, { data: lst }] = await Promise.all([
          supabase.from("profiles").select("id, full_name").in("id", otherIds),
          listingIds.length
            ? supabase.from("listings").select("id, title").in("id", listingIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);
        const pmap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
        const lmap = Object.fromEntries((lst ?? []).map((l: any) => [l.id, l.title]));
        list.forEach((t) => { t.other_name = pmap[t.other_id] ?? null; t.listing_title = t.listing_id ? lmap[t.listing_id] ?? null : null; });
      }
      if (!alive) return;
      setThreads(list);
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Messages</h1>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No conversations yet. Start one from a listing page.</p>
            <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Browse cars →</Link>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {threads.map((t) => (
              <li key={`${t.listing_id}-${t.other_id}`}>
                <Link
                  to="/chat/$listingId/$otherId"
                  params={{ listingId: t.listing_id ?? "_", otherId: t.other_id }}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50"
                >
                  <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary">{initialsOf(t.other_name || "?")}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">{t.other_name || "Unknown"}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{new Date(t.last_at).toLocaleDateString()}</span>
                    </div>
                    {t.listing_title && <p className="truncate text-xs text-primary">{t.listing_title}</p>}
                    <p className="truncate text-sm text-muted-foreground">{t.last_message}</p>
                  </div>
                  {t.unread_count > 0 && <Badge className="bg-primary text-primary-foreground">{t.unread_count}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
