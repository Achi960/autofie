import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { formatGHS } from "@/lib/format";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-listings/closed")({
  component: ClosedListings,
});

type Row = { id: string; title: string; price: number; status: string; cover_photo_url: string | null; created_at: string };

function ClosedListings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [covers, setCovers] = useState<Record<string, string | null>>({});

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("listings")
      .select("id, title, price, status, cover_photo_url, created_at")
      .eq("user_id", user.id)
      .in("status", ["closed", "rejected"])
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { load(); }, [user]);
  useEffect(() => {
    rows.forEach((r) => {
      if (r.cover_photo_url && covers[r.id] === undefined) {
        signedUrl("listing-photos", r.cover_photo_url).then((u) => setCovers((c) => ({ ...c, [r.id]: u })));
      }
    });
  }, [rows]);

  const reactivate = async (r: Row) => {
    const { error } = await supabase.from("listings").update({ status: "pending" }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Re-submitted — admin will re-approve");
    load();
  };

  const remove = async (r: Row) => {
    // delete photos in storage first
    const { data: photos } = await supabase.from("listing_photos").select("url").eq("listing_id", r.id);
    const paths = (photos ?? []).map((p: any) => p.url).filter(Boolean);
    if (paths.length) await supabase.storage.from("listing-photos").remove(paths);
    const { error } = await supabase.from("listings").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    setRows((arr) => arr.filter((x) => x.id !== r.id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Closed listings</h1>
          <Link to="/my-listings"><Button variant="outline" size="sm">← Active listings</Button></Link>
        </div>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">Nothing here.</p>
          ) : rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {covers[r.id] && <img src={covers[r.id]!} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-semibold">{r.title}</p>
                <p className="text-sm font-semibold text-primary">{formatGHS(r.price)}</p>
                <Badge variant="outline" className="mt-1">{r.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => reactivate(r)}>Reactivate</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                      <AlertDialogDescription>This permanently removes "{r.title}" and its photos.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(r)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
