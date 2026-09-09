import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ReviewsSection } from "@/components/ReviewsSection";
import { useAuth } from "@/lib/auth-context";
import { loadDealerByHandle, dealerHead } from "@/lib/dealer-seo";

export const Route = createFileRoute("/dealer/$handle/reviews")({
  loader: async ({ params }) => {
    const dealer = await loadDealerByHandle(params.handle);
    if (!dealer) throw notFound();
    return { dealer };
  },
  head: ({ params, loaderData }) => dealerHead(loaderData?.dealer, params.handle, "/reviews"),
  notFoundComponent: Missing,
  component: DealerReviewsPage,
});

function DealerReviewsPage() {
  const { dealer } = Route.useLoaderData();
  const { handle } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: "/" })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Review {dealer.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your honest experience to help other buyers on AutoFie.
          </p>
          <Link to="/dealer/$handle" params={{ handle }} className="mt-2 inline-block text-sm text-primary hover:underline">
            View {dealer.name}'s profile →
          </Link>
        </div>
        <ReviewsSection dealerId={dealer.id} dealerName={dealer.name} autoOpen />
      </div>
    </div>
  );
}

function Missing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Seller not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back home</Link>
      </div>
    </div>
  );
}
