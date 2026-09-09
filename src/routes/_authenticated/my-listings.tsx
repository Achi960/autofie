import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListingLink } from "@/components/ListingLink";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { formatGHS } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-listings")({
  component: MyListings,
});

type Row = { id: string; slug: string | null; category: string | null; make: string | null; title: string; price: number; status: string; cover_photo_url: string | null; created_at: string };

function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState("all");
  const [covers, setCovers] = useState<Record<string, string | null>>({});

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("listings")
      .select("id, slug, category, make, title, price, status, cover_photo_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    rows.forEach((r) => {
      if (r.cover_photo_url && covers[r.id] === undefined) {
        signedUrl("listing-photos", r.cover_photo_url).then((u) => setCovers((c) => ({ ...c, [r.id]: u })));
      }
    });
  }, [rows]);

  const filtered = tab === "all" ? rows
    : tab === "live" ? rows.filter(r => r.status === "approved")
    : tab === "pending" ? rows.filter(r => r.status === "pending")
    : tab === "rejected" ? rows.filter(r => r.status === "rejected")
    : rows.filter(r => r.status === "closed");

  const toggleClose = async (r: Row) => {
    if (r.status === "closed") {
      navigate({ to: "/edit-listing/$id", params: { id: r.id } });
      return;
    }
    await supabase.from("listings").update({ status: "closed" }).eq("id", r.id);
    toast.success("Listing closed");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My listings</h1>
          <Link to="/submit-listing"><Button>New listing</Button></Link>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">Nothing here yet.</p>
            ) : filtered.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {covers[r.id] && <img src={covers[r.id]!} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-semibold">{r.title}</p>
                  <p className="text-sm text-primary font-semibold">{formatGHS(r.price)}</p>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex gap-2">
                  <ListingLink listing={r}><Button variant="outline" size="sm">View</Button></ListingLink>
                  <Link to="/edit-listing/$id" params={{ id: r.id }}><Button variant="outline" size="sm">Edit</Button></Link>
                  <Button size="sm" variant={r.status === "closed" ? "default" : "outline"} onClick={() => toggleClose(r)}>
                    {r.status === "closed" ? "Review & reactivate" : "Close"}
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const variants: Record<string, string> = {
    approved: "border-success/30 bg-success/10 text-success",
    pending: "border-primary/30 bg-primary/10 text-primary",
    rejected: "border-destructive/30 bg-destructive/10 text-destructive",
    closed: "border-muted-foreground/30 bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={`mt-1 ${variants[status] ?? ""}`}>{status === "approved" ? "Live" : status}</Badge>;
}
