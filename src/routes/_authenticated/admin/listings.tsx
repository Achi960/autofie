import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { formatGHS } from "@/lib/format";
import { LISTING_REJECTION_REASONS } from "@/lib/ghana";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: AdminListings,
});

function waitingFor(created_at: string) {
  const hours = (Date.now() - new Date(created_at).getTime()) / 3_600_000;
  const txt = hours < 1 ? `${Math.round(hours * 60)}m` : `${Math.round(hours)}h`;
  const cls = hours > 24 ? "text-destructive" : hours > 12 ? "text-primary" : "text-success";
  return { txt, cls };
}

function AdminListings() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const [reviewing, setReviewing] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) { toast.error("Admins only"); navigate({ to: "/" }); }
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    const { data, error } = await supabase.from("listings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) { console.error("admin listings load error", error); toast.error(error.message); setRows([]); return; }
    const list = data ?? [];
    const ids = Array.from(new Set(list.map((r: any) => r.user_id).filter(Boolean)));
    let profMap: Record<string, { full_name: string | null; phone: string | null; handle: string | null; public_code: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await (supabase.from("profiles") as any).select("id, full_name, phone, handle, public_code").in("id", ids);
      profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name, phone: p.phone, handle: p.handle, public_code: p.public_code }]));
    }
    setRows(list.map((r: any) => ({ ...r, profiles: profMap[r.user_id] ?? null })));
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-listings-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, (payload) => {
        load();
        if (payload.eventType === "INSERT") {
          toast.info("New listing submitted for review");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  useEffect(() => {
    rows.forEach((r) => {
      if (r.cover_photo_url && covers[r.id] === undefined) {
        signedUrl("listing-photos", r.cover_photo_url).then((u) => setCovers((c) => ({ ...c, [r.id]: u })));
      }
    });
  }, [rows]);

  const approve = async (r: any) => {
    await supabase.from("listings").update({ status: "approved", rejection_reason: null }).eq("id", r.id);
    toast.success("Approved"); load();
  };
  const reject = async (reason: string) => {
    if (!reviewing) return;
    await supabase.from("listings").update({ status: "rejected", rejection_reason: reason }).eq("id", reviewing.id);
    toast.success("Rejected"); setReviewing(null); load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold">Admin · Pending listings ({rows.length})</h1>
        <div className="mt-4 space-y-3">
          {rows.length === 0 && <p className="text-muted-foreground">No listings waiting for review.</p>}
          {rows.map((r) => {
            const w = waitingFor(r.created_at);
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                  {covers[r.id] && <img src={covers[r.id]!} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-semibold">{r.title}</p>
                  <p className="text-sm font-semibold text-primary">{formatGHS(r.price)}</p>
                  <p className="text-xs text-muted-foreground">{r.profiles?.full_name} · {r.region}, {r.district}</p>
                  <p className={`text-xs font-medium ${w.cls}`}>Waiting {w.txt}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link to="/admin/listing/$id" params={{ id: r.id }}><Button size="sm" className="w-full">Review</Button></Link>
                  <Button size="sm" onClick={() => approve(r)} className="bg-success text-success-foreground hover:bg-success/90">Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setReviewing(r)}>Reject</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject "{reviewing?.title}"</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {LISTING_REJECTION_REASONS.map(r => (
              <Button key={r} variant="outline" className="w-full justify-start" onClick={() => reject(r)}>{r}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
