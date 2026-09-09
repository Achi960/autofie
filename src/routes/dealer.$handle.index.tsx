import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { DealerProfile } from "@/components/DealerProfile";
import { loadDealerByHandle, dealerHead } from "@/lib/dealer-seo";

export const Route = createFileRoute("/dealer/$handle/")({
  loader: async ({ params }) => {
    const dealer = await loadDealerByHandle(params.handle);
    if (!dealer) throw notFound();
    return { dealer };
  },
  head: ({ params, loaderData }) => dealerHead(loaderData?.dealer, params.handle),
  notFoundComponent: DealerMissing,
  component: DealerPage,
});

function DealerPage() {
  const { dealer } = Route.useLoaderData();
  return <DealerProfile id={dealer.id} />;
}

function DealerMissing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Seller not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back home</Link>
      </div>
    </div>
  );
}
