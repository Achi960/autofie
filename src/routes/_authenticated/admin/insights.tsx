import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, ShieldCheck, Car, MessagesSquare, Eye, Phone, MessageSquare, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/insights")({
  component: AdminInsights,
});

type Overview = {
  users_total: number; users_banned: number;
  dealers_verified: number; dealers_pending: number;
  listings_total: number; listings_approved: number; listings_pending: number; listings_new_7d: number;
  messages_total: number; messages_7d: number;
  views_total: number; phone_clicks_total: number; chat_clicks_total: number;
  reports_open: number;
  top_listings: Array<{ id: string; title: string; price: number; cover_photo_url: string | null; views: number; phone_clicks: number; chat_clicks: number }>;
  signups_14d: Array<{ day: string; n: number }>;
};

function Stat({ icon: Icon, label, value, hint, tone = "default" }: { icon: any; label: string; value: string | number; hint?: string; tone?: "default" | "warning" | "success" }) {
  const toneClass = tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-primary";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AdminInsights() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) { toast.error("Admins only"); navigate({ to: "/" }); }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) { toast.error(error.message); return; }
      setData(data as unknown as Overview);
    })();
  }, [isAdmin]);

  const maxSignup = Math.max(1, ...(data?.signups_14d.map((d) => d.n) ?? [1]));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">Admin · Site insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of engagement, traffic, and what people are interacting with.</p>

        {!data ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Users} label="Total users" value={data.users_total} hint={`${data.users_banned} banned`} />
              <Stat icon={ShieldCheck} label="Verified dealers" value={data.dealers_verified} hint={`${data.dealers_pending} pending`} tone="success" />
              <Stat icon={Car} label="Listings" value={data.listings_total} hint={`${data.listings_approved} live · ${data.listings_pending} pending · ${data.listings_new_7d} new in 7d`} />
              <Stat icon={MessagesSquare} label="Messages" value={data.messages_total} hint={`${data.messages_7d} in last 7 days`} />
              <Stat icon={Eye} label="Listing views" value={data.views_total} hint="All time" />
              <Stat icon={Phone} label="Phone reveals" value={data.phone_clicks_total} />
              <Stat icon={MessageSquare} label="Chat clicks" value={data.chat_clicks_total} />
              <Stat icon={AlertTriangle} label="Open reports" value={data.reports_open} tone="warning" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">New signups (last 14 days)</h2>
                {data.signups_14d.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signups yet.</p>
                ) : (
                  <div className="flex h-32 items-end gap-1">
                    {data.signups_14d.map((d) => (
                      <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.n}`}>
                        <div className="w-full rounded-t bg-primary/70" style={{ height: `${(d.n / maxSignup) * 100}%`, minHeight: 2 }} />
                        <span className="text-[9px] text-muted-foreground">{d.day.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">Most viewed listings</h2>
                {data.top_listings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No views yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.top_listings.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border p-2">
                        <Link to="/listing/$id" params={{ id: l.id }} className="flex min-w-0 flex-1 items-center gap-2 hover:underline">
                          <span className="truncate text-sm font-medium">{l.title}</span>
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {l.views} views · {l.chat_clicks} chats · {l.phone_clicks} calls
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
