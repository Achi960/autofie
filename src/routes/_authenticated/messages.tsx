import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { signedUrl } from "@/lib/storage";
import { initialsOf } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesIndex,
});

type Thread = {
  listing_id: string | null;
  other_id: string;
  last_message: string;
  last_at: string;
  unread_count: number;
  listing_title?: string;
  listing_cover?: string | null;
  other_name?: string;
};

function MessagesIndex() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const { data, error } = await (supabase as any).rpc("list_my_threads");
      if (error || !data) { setLoading(false); return; }
      const rows = data as Thread[];
      const listingIds = [...new Set(rows.map((r) => r.listing_id).filter(Boolean))] as string[];
      const otherIds = [...new Set(rows.map((r) => r.other_id))];
      const [listingsRes, profilesRes] = await Promise.all([
        listingIds.length
          ? supabase.from("listings").select("id, title, cover_photo_url").in("id", listingIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("profiles").select("id, full_name").in("id", otherIds),
      ]);
      const lById: Record<string, any> = {};
      (listingsRes.data ?? []).forEach((l: any) => { lById[l.id] = l; });
      const pById: Record<string, any> = {};
      (profilesRes.data ?? []).forEach((p: any) => { pById[p.id] = p; });

      const enriched = await Promise.all(rows.map(async (r) => {
        const l = r.listing_id ? lById[r.listing_id] : null;
        const cover = l?.cover_photo_url ? await signedUrl("listing-photos", l.cover_photo_url) : null;
        return {
          ...r,
          listing_title: l?.title ?? "(deleted listing)",
          listing_cover: cover,
          other_name: pById[r.other_id]?.full_name ?? "User",
        };
      }));
      if (alive) { setThreads(enriched); setLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        {loading ? (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : threads.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-50" />
            No conversations yet. Message a dealer from a listing page to start.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {threads.map((t, i) => (
              <li key={`${t.listing_id}-${t.other_id}-${i}`}>
                <Link
                  to="/messages/$listingId/$otherId"
                  params={{ listingId: t.listing_id ?? "none", otherId: t.other_id }}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:border-primary"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {t.listing_cover && <img src={t.listing_cover} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <Avatar className="h-9 w-9 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-xs">{initialsOf(t.other_name)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{t.other_name}</p>
                      {t.unread_count > 0 && <Badge className="bg-primary">{t.unread_count}</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{t.listing_title}</p>
                    <p className="truncate text-xs text-foreground/70">{t.last_message}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
