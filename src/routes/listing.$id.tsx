import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { listingPath } from "@/lib/urls";

/** Legacy UUID listing URL — permanently redirects to the readable address. */
export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const { data } = await (supabase.from("listings") as any)
      .select("id, slug, category, make")
      .eq("id", params.id)
      .maybeSingle();
    if (data) {
      throw redirect({ href: listingPath(data as any), statusCode: 301, throw: true });
    }
    return null;
  },
  head: () => ({ meta: [{ title: "Listing moved — AutoFie" }, { name: "robots", content: "noindex" }] }),
  component: LegacyListing,
});

function LegacyListing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Listing not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    </div>
  );
}
