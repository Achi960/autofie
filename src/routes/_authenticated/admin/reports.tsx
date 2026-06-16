import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ban, CheckCircle2, XCircle, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  listing_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
};

type Tab = "open" | "resolved" | "all";

function AdminReports() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; phone: string | null; is_banned: boolean }>>({});
  const [listings, setListings] = useState<Record<string, { title: string }>>({});
  const [tab, setTab] = useState<Tab>("open");

  useEffect(() => {
    if (!loading && !isAdmin) { toast.error("Admins only"); navigate({ to: "/" }); }
  }, [loading, isAdmin, navigate]);

  const load = async () => {
    const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const rows = (data ?? []) as Report[];
    setReports(rows);
    const userIds = Array.from(new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id]).filter(Boolean) as string[]));
    const listingIds = Array.from(new Set(rows.map((r) => r.listing_id).filter(Boolean) as string[]));
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone, is_banned").in("id", userIds);
      setProfiles(Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name, phone: p.phone, is_banned: p.is_banned }])));
    }
    if (listingIds.length) {
      const { data: lst } = await supabase.from("listings").select("id, title").in("id", listingIds);
      setListings(Object.fromEntries((lst ?? []).map((l: any) => [l.id, { title: l.title }])));
    }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const visible = reports.filter((r) => tab === "all" || (tab === "open" ? r.status === "open" || r.status === "reviewing" : r.status === "resolved" || r.status === "dismissed"));

  const setStatus = async (id: string, status: Report["status"]) => {
    const { error } = await supabase.from("reports").update({ status, resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`); load();
  };

  const toggleBan = async (userId: string, currentlyBanned: boolean, reason?: string) => {
    if (!currentlyBanned) {
      const r = prompt("Reason for blocking this user? (shown internally)");
      if (r === null) return;
      reason = r || "Policy violation";
    }
    const payload = currentlyBanned
      ? { is_banned: false, banned_reason: null, banned_at: null }
      : { is_banned: true, banned_reason: reason, banned_at: new Date().toISOString() };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(currentlyBanned ? "User unblocked" : "User blocked");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold">Admin · Reports</h1>

        <div className="mt-4 flex gap-2 border-b">
          {(["open", "resolved", "all"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium capitalize border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {visible.length === 0 && <p className="text-muted-foreground">No reports.</p>}
          {visible.map((r) => {
            const reporter = profiles[r.reporter_id];
            const reported = r.reported_user_id ? profiles[r.reported_user_id] : null;
            const listing = r.listing_id ? listings[r.listing_id] : null;
            return (
              <div key={r.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.reason}</p>
                    {r.details && <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reported by <Link to="/user/$id" params={{ id: r.reporter_id }} className="underline">{reporter?.full_name || "user"}</Link>
                      {" · "}{new Date(r.created_at).toLocaleString()}
                    </p>
                    {reported && r.reported_user_id && (
                      <p className="mt-1 text-xs">
                        Reported user: <Link to="/user/$id" params={{ id: r.reported_user_id }} className="font-medium underline">{reported.full_name || r.reported_user_id.slice(0, 8)}</Link>
                        {reported.is_banned && <Badge variant="outline" className="ml-2 border-destructive/40 bg-destructive/10 text-destructive">Blocked</Badge>}
                      </p>
                    )}
                    {listing && r.listing_id && (
                      <p className="mt-1 text-xs">
                        Listing: <Link to="/listing/$id" params={{ id: r.listing_id }} className="font-medium underline">{listing.title}</Link>
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={
                    r.status === "open" ? "border-warning/40 bg-warning/10 text-warning"
                    : r.status === "resolved" ? "border-success/40 bg-success/10 text-success"
                    : "border-muted-foreground/30"
                  }>{r.status}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.reported_user_id && (
                    <Button size="sm" variant={reported?.is_banned ? "outline" : "destructive"}
                      onClick={() => toggleBan(r.reported_user_id!, !!reported?.is_banned)}>
                      {reported?.is_banned ? <><ShieldOff className="mr-1 h-3.5 w-3.5" />Unblock user</> : <><Ban className="mr-1 h-3.5 w-3.5" />Block user</>}
                    </Button>
                  )}
                  {r.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "resolved")}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Mark resolved
                    </Button>
                  )}
                  {r.status !== "dismissed" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "dismissed")}>
                      <XCircle className="mr-1 h-3.5 w-3.5" />Dismiss
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
