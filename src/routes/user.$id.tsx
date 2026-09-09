import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

/** Legacy UUID profile URL — permanently redirects to the readable shop address. */
export const Route = createFileRoute("/user/$id")({
  loader: async ({ params }) => {
    const { data } = await (supabase.from("profiles") as any)
      .select("handle")
      .eq("id", params.id)
      .maybeSingle();
    if (data?.handle) {
      throw redirect({ href: `/dealer/${data.handle}`, statusCode: 301, throw: true });
    }
    return null;
  },
  head: () => ({ meta: [{ title: "Profile moved — AutoFie" }, { name: "robots", content: "noindex" }] }),
  component: LegacyUser,
});

function LegacyUser() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back home</Link>
      </div>
    </div>
  );
}
