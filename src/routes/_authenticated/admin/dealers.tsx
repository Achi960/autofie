import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/dealers")({
  component: AdminDealers,
});

type Tab = "pending" | "approved" | "rejected" | "all";

function AdminDealers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState<Tab>("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Admins only");
      navigate({ to: "/" });
    }
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    const { data: dealers, error } = await supabase.from("dealer_profiles")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const ids = (dealers ?? []).map(d => d.user_id);
    let profilesById: Record<string, { full_name: string | null; phone: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone").in("id", ids);
      profilesById = Object.fromEntries((profs ?? []).map(p => [p.id, { full_name: p.full_name, phone: p.phone }]));
    }
    setApps((dealers ?? []).map(d => ({ ...d, profiles: profilesById[d.user_id] ?? null })));
    setSelected(new Set());
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  useEffect(() => {
    apps.forEach((a) => {
      ["id_front_url", "id_back_url", "selfie_url"].forEach((k) => {
        const path = a[k]; if (!path || urls[path] !== undefined) return;
        signedUrl("dealer-docs", path).then((u) => setUrls((m) => ({ ...m, [path]: u })));
      });
    });
  }, [apps]);

  const visible = useMemo(() => tab === "all" ? apps : apps.filter(a => a.status === tab), [apps, tab]);
  useEffect(() => { setSelected(new Set()); }, [tab]);

  const counts = useMemo(() => ({
    pending: apps.filter(a => a.status === "pending").length,
    approved: apps.filter(a => a.status === "approved").length,
    rejected: apps.filter(a => a.status === "rejected").length,
    all: apps.length,
  }), [apps]);

  const toggleOne = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map(a => a.user_id)));
  };

  const approveIds = async (ids: string[]) => {
    if (!ids.length) return;
    const nowIso = new Date().toISOString();
    const { error } = await supabase.from("dealer_profiles")
      .update({ status: "approved", reviewed_at: nowIso, rejection_reason: null })
      .in("user_id", ids);
    if (error) { toast.error(error.message); return; }
    const rows = ids.map(user_id => ({ user_id, role: "dealer_verified" as const }));
    await supabase.from("user_roles").upsert(rows, { onConflict: "user_id,role" });
    await supabase.from("user_roles").delete().in("user_id", ids).eq("role", "dealer_pending");
    toast.success(ids.length === 1 ? "Dealer approved" : `${ids.length} dealers approved`);
    load();
  };

  const rejectIds = async (ids: string[], why: string) => {
    if (!ids.length || !why.trim()) { toast.error("Provide a reason"); return; }
    const { error } = await supabase.from("dealer_profiles")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), rejection_reason: why })
      .in("user_id", ids);
    if (error) { toast.error(error.message); return; }
    await supabase.from("user_roles").delete().in("user_id", ids).eq("role", "dealer_pending");
    await supabase.from("user_roles").delete().in("user_id", ids).eq("role", "dealer_verified");
    toast.success(ids.length === 1 ? "Application rejected" : `${ids.length} applications rejected`);
    setReviewing(null); setBulkRejecting(false); setReason(""); load();
  };

  const revokeApproval = async (a: any) => {
    if (!confirm(`Revoke ${a.business_name}'s verified status? Their existing listings stay live but they will need re-approval to be verified again.`)) return;
    const { error } = await supabase.from("dealer_profiles")
      .update({ status: "pending", reviewed_at: new Date().toISOString(), rejection_reason: null })
      .eq("user_id", a.user_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("user_roles").delete().eq("user_id", a.user_id).eq("role", "dealer_verified");
    await supabase.from("user_roles").upsert({ user_id: a.user_id, role: "dealer_pending" }, { onConflict: "user_id,role" });
    toast.success("Approval revoked — moved back to pending");
    load();
  };

  const selectedIds = Array.from(selected);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">Admin · Dealer applications</h1>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b">
          {(["pending", "approved", "rejected", "all"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium capitalize transition border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t} ({counts[t]})
            </button>
          ))}
        </div>

        {/* Bulk bar */}
        {visible.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={selected.size > 0 && selected.size === visible.length} onCheckedChange={toggleAll} />
              {selected.size === 0 ? "Select all" : `${selected.size} selected`}
            </label>
            {selectedIds.length > 0 && tab !== "approved" && (
              <Button size="sm" onClick={() => approveIds(selectedIds)} className="bg-success text-success-foreground hover:bg-success/90">
                Approve selected ({selectedIds.length})
              </Button>
            )}
            {selectedIds.length > 0 && tab !== "rejected" && (
              <Button size="sm" variant="outline" onClick={() => { setBulkRejecting(true); setReason(""); }}>
                Reject selected ({selectedIds.length})
              </Button>
            )}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {visible.length === 0 && <p className="text-muted-foreground">No applications in this view.</p>}
          {visible.map(a => (
            <div key={a.user_id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Checkbox className="mt-1" checked={selected.has(a.user_id)} onCheckedChange={() => toggleOne(a.user_id)} />
                  <div>
                    <p className="font-semibold">{a.business_name}</p>
                    <p className="text-sm text-muted-foreground">{a.profiles?.full_name} · {a.phone} · {a.region}, {a.district}</p>
                    <p className="text-xs text-muted-foreground">Ghana Card: {a.ghana_card_number}</p>
                  </div>
                </div>
                <Badge variant="outline" className={
                  a.status === "approved" ? "border-success/30 bg-success/10 text-success"
                  : a.status === "rejected" ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/10 text-primary"
                }>{a.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["id_front_url", "id_back_url", "selfie_url"].map((k) => {
                  const path = a[k]; const url = path ? urls[path] : null;
                  return (
                    <div key={k} className="aspect-square overflow-hidden rounded-md border bg-muted">
                      {url ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={k} className="h-full w-full object-cover" /></a>
                        : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{k.replace("_url","")}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => approveIds([a.user_id])} className="bg-success text-success-foreground hover:bg-success/90">Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => { setReviewing(a); setReason(""); }}>Reject</Button>
                  </>
                )}
                {a.status === "approved" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => revokeApproval(a)} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                      Revoke approval
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setReviewing(a); setReason(""); }}>Reject</Button>
                  </>
                )}
                {a.status === "rejected" && (
                  <Button size="sm" onClick={() => approveIds([a.user_id])} className="bg-success text-success-foreground hover:bg-success/90">Approve anyway</Button>
                )}
              </div>
              {a.status === "rejected" && a.rejection_reason && (
                <p className="mt-2 text-sm text-destructive">Reason: {a.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Single reject dialog */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject application</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason shown to the dealer…" />
          <Button variant="destructive" onClick={() => reviewing && rejectIds([reviewing.user_id], reason)}>Confirm rejection</Button>
        </DialogContent>
      </Dialog>

      {/* Bulk reject dialog */}
      <Dialog open={bulkRejecting} onOpenChange={(o) => !o && setBulkRejecting(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {selectedIds.length} application{selectedIds.length === 1 ? "" : "s"}</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason shown to the dealers…" />
          <Button variant="destructive" onClick={() => rejectIds(selectedIds, reason)}>Confirm rejection</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
