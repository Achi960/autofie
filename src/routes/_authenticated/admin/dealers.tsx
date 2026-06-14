import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/dealers")({
  component: AdminDealers,
});

function AdminDealers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Admins only");
      navigate({ to: "/" });
    }
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    const { data } = await supabase.from("dealer_profiles")
      .select("*, profiles!dealer_profiles_user_id_fkey(full_name, phone)")
      .order("submitted_at", { ascending: false });
    setApps(data ?? []);
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

  const approve = async (a: any) => {
    await supabase.from("dealer_profiles").update({ status: "approved", reviewed_at: new Date().toISOString(), rejection_reason: null }).eq("user_id", a.user_id);
    await supabase.from("user_roles").upsert({ user_id: a.user_id, role: "dealer_verified" }, { onConflict: "user_id,role" });
    await supabase.from("user_roles").delete().eq("user_id", a.user_id).eq("role", "dealer_pending");
    toast.success("Dealer approved");
    load();
  };
  const reject = async () => {
    if (!reviewing || !reason.trim()) { toast.error("Provide a reason"); return; }
    await supabase.from("dealer_profiles").update({ status: "rejected", reviewed_at: new Date().toISOString(), rejection_reason: reason }).eq("user_id", reviewing.user_id);
    await supabase.from("user_roles").delete().eq("user_id", reviewing.user_id).eq("role", "dealer_pending");
    toast.success("Application rejected");
    setReviewing(null); setReason(""); load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">Admin · Dealer applications</h1>
        <div className="mt-4 space-y-4">
          {apps.length === 0 && <p className="text-muted-foreground">No applications.</p>}
          {apps.map(a => (
            <div key={a.user_id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.business_name}</p>
                  <p className="text-sm text-muted-foreground">{a.profiles?.full_name} · {a.phone} · {a.region}, {a.district}</p>
                  <p className="text-xs text-muted-foreground">Ghana Card: {a.ghana_card_number}</p>
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
              {a.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => approve(a)} className="bg-success text-success-foreground hover:bg-success/90">Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => { setReviewing(a); setReason(""); }}>Reject</Button>
                </div>
              )}
              {a.status === "rejected" && a.rejection_reason && (
                <p className="mt-2 text-sm text-destructive">Reason: {a.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject application</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason shown to the dealer…" />
          <Button variant="destructive" onClick={reject}>Confirm rejection</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
