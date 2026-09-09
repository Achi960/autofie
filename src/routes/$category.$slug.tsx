import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { ListingDetail } from "@/components/ListingDetail";
import { loadListingBySlug, listingHead } from "@/lib/listing-seo";
import { URL_CATEGORY } from "@/lib/urls";

export const Route = createFileRoute("/$category/$slug")({
  loader: async ({ params }) => {
    if (!URL_CATEGORY[params.category]) throw notFound();
    const meta = await loadListingBySlug(params.slug);
    if (!meta) throw notFound();
    return { meta };
  },
  head: ({ params, loaderData }) => listingHead(loaderData?.meta, `/${params.category}/${params.slug}`),
  notFoundComponent: ListingMissing,
  component: ListingPage,
});

function ListingPage() {
  const { meta } = Route.useLoaderData();
  return <ListingDetail id={meta.id} />;
}

function ListingMissing() {
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
