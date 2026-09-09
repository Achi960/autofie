import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

/** Legacy UUID admin review URL — forwards to the readable dealer/listing address. */
export const Route = createFileRoute("/_authenticated/admin/listing/$id")({
  component: LegacyAdminListing,
});

function LegacyAdminListing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("listings") as any)
        .select("id, slug, user_id")
        .eq("id", id)
        .maybeSingle();
      if (!data) { navigate({ to: "/admin/listings" }); return; }
      const { data: prof } = await (supabase.from("profiles") as any)
        .select("handle")
        .eq("id", data.user_id)
        .maybeSingle();
      navigate({
        to: "/admin/listing/$handle/$slug",
        params: { handle: prof?.handle || "seller", slug: data.slug || data.id },
        replace: true,
      });
    })();
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground">Opening listing…</div>
    </div>
  );
}
