import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Ban, RotateCcw, MoreVertical } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { initialsOf } from "@/lib/format";
import { signedUrl } from "@/lib/storage";
import { isOnline, lastSeenLabel } from "@/lib/presence";
import { toast } from "sonner";

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
  other_avatar?: string | null;
  other_last_seen?: string | null;
  listing_title?: string | null;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [spam, setSpam] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  // Tick every 30s so "Online / 2m ago" labels stay fresh
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    if (!user) return;
    const [{ data: threadRows }, { data: spamRows }] = await Promise.all([
      supabase.rpc("list_my_threads"),
      (supabase as any).from("spam_blocks").select("blocked_id").eq("user_id", user.id),
    ]);
    const list = ((threadRows ?? []) as Thread[]);
    const spamSet = new Set<string>(((spamRows as any[]) ?? []).map((r) => r.blocked_id));
    setSpam(spamSet);

    if (list.length) {
      const otherIds = Array.from(new Set(list.map((t) => t.other_id)));
      const listingIds = Array.from(new Set(list.map((t) => t.listing_id).filter(Boolean) as string[]));
      const [{ data: profs }, { data: lst }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, last_seen_at").in("id", otherIds),
        listingIds.length
          ? supabase.from("listings").select("id, title").in("id", listingIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const pmap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
      const lmap = Object.fromEntries((lst ?? []).map((l: any) => [l.id, l.title]));
      for (const t of list) {
        const p = pmap[t.other_id];
        t.other_name = p?.full_name ?? null;
        t.other_last_seen = p?.last_seen_at ?? null;
        t.listing_title = t.listing_id ? lmap[t.listing_id] ?? null : null;
        if (p?.avatar_url) {
          // resolve avatar in background
          signedUrl("avatars", p.avatar_url).then((u) => {
            t.other_avatar = u;
            setThreads((prev) => [...prev]);
          });
        }
      }
    }
    setThreads(list);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const buckets = useMemo(() => {
    const inSpam = threads.filter((t) => spam.has(t.other_id));
    const notSpam = threads.filter((t) => !spam.has(t.other_id));
    return {
      all: notSpam,
      unread: notSpam.filter((t) => t.unread_count > 0),
      spam: inSpam,
    };
  }, [threads, spam]);

  const toggleSpam = async (otherId: string, mark: boolean) => {
    if (!user) return;
    if (mark) {
      const { error } = await (supabase as any).from("spam_blocks").insert({ user_id: user.id, blocked_id: otherId });
      if (error) return toast.error(error.message);
      setSpam((s) => new Set(s).add(otherId));
      toast.success("Moved to Spam");
    } else {
      const { error } = await (supabase as any).from("spam_blocks").delete().eq("user_id", user.id).eq("blocked_id", otherId);
      if (error) return toast.error(error.message);
      setSpam((s) => { const n = new Set(s); n.delete(otherId); return n; });
      toast.success("Restored to inbox");
    }
  };

  const renderList = (items: Thread[], emptyMsg: string, isSpamTab = false) => {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{emptyMsg}</p>
        </div>
      );
    }
    return (
      <ul className="divide-y rounded-xl border bg-card">
        {items.map((t) => {
          const online = isOnline(t.other_last_seen);
          return (
            <li key={`${t.listing_id}-${t.other_id}`} className="relative">
              <Link
                to="/chat/$listingId/$otherId"
                params={{ listingId: t.listing_id ?? "_", otherId: t.other_id }}
                className="flex items-center gap-3 p-3 pr-12 hover:bg-muted/50"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    {t.other_avatar && <AvatarImage src={t.other_avatar} alt={t.other_name ?? ""} />}
                    <AvatarFallback className="bg-primary/10 text-primary">{initialsOf(t.other_name || "?")}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${online ? "bg-success" : "bg-muted-foreground/60"}`}
                    aria-label={online ? "Online" : "Offline"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-foreground">{t.other_name || "Unknown"}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(t.last_at)}</span>
                  </div>
                  <p className={`truncate text-xs ${online ? "text-success font-medium" : "text-muted-foreground"}`}>
                    {lastSeenLabel(t.other_last_seen)}
                  </p>
                  {t.listing_title && <p className="truncate text-xs text-primary">{t.listing_title}</p>}
                  <p className="truncate text-sm text-muted-foreground">{t.last_message}</p>
                </div>
                {t.unread_count > 0 && !isSpamTab && (
                  <Badge className="bg-primary text-primary-foreground">{t.unread_count}</Badge>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isSpamTab ? (
                    <DropdownMenuItem onClick={() => toggleSpam(t.other_id, false)}>
                      <RotateCcw className="mr-2 h-4 w-4" />Restore to inbox
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => toggleSpam(t.other_id, true)} className="text-destructive">
                      <Ban className="mr-2 h-4 w-4" />Mark as spam
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    );
  };

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
          <Tabs defaultValue="all">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All <span className="ml-1.5 text-xs text-muted-foreground">({buckets.all.length})</span>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread {buckets.unread.length > 0 && (
                  <Badge className="ml-1.5 h-5 min-w-5 bg-primary px-1.5 text-[10px] text-primary-foreground">{buckets.unread.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="spam">
                Spam <span className="ml-1.5 text-xs text-muted-foreground">({buckets.spam.length})</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderList(buckets.all, "No conversations.")}</TabsContent>
            <TabsContent value="unread">{renderList(buckets.unread, "You're all caught up. No unread messages.")}</TabsContent>
            <TabsContent value="spam">{renderList(buckets.spam, "Nothing in Spam.", true)}</TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
