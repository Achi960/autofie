import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ReviewsSection } from "@/components/ReviewsSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/review/$id")({
  component: ReviewPage,
});

function ReviewPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("this dealer");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: d }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", id).maybeSingle(),
        supabase.from("dealer_profiles").select("business_name").eq("user_id", id).maybeSingle(),
      ]);
      if (!p) { setNotFound(true); return; }
      setName((d?.business_name as string) || (p.full_name as string) || "this dealer");
    })();
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: `/review/${id}` } as any });
  }, [authLoading, user, id, navigate]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: "/" })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Review {name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your honest experience to help other buyers on Autofie.
          </p>
          <Link to="/user/$id" params={{ id }} className="mt-2 inline-block text-sm text-primary hover:underline">
            View {name}'s profile →
          </Link>
        </div>
        <ReviewsSection dealerId={id} dealerName={name} autoOpen />
      </div>
    </div>
  );
}
