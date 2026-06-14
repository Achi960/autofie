import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-saved")({
  component: MySaved,
});

function MySaved() {
  const { user } = useAuth();
  const [items, setItems] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_listings")
      .select(`listing_id, listings(id,title,price,region,condition,transmission,mileage,cover_photo_url,user_id,
                                   profiles!listings_user_id_fkey(full_name),
                                   dealer_profiles!dealer_profiles_user_id_fkey(status))`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const mapped = (data ?? [])
      .map((row: any) => row.listings)
      .filter(Boolean)
      .map((l: any): ListingCardData => ({
        id: l.id, title: l.title, price: Number(l.price), region: l.region,
        condition: l.condition, transmission: l.transmission, mileage: l.mileage,
        cover_photo_url: l.cover_photo_url,
        dealer_name: l.profiles?.full_name ?? null,
        dealer_verified: l.dealer_profiles?.status === "approved",
      }));
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const unsave = async (id: string) => {
    if (!user) return;
    await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", id);
    setItems((arr) => arr.filter((i) => i.id !== id));
    toast.success("Removed");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-bold">Saved listings</h1>
        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
            You haven't saved any listings yet. Tap the heart on any listing to save it.{" "}
            <Link to="/" className="font-medium text-primary hover:underline">Browse</Link>
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((l) => <ListingCard key={l.id} listing={l} isSaved onToggleSave={() => unsave(l.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
