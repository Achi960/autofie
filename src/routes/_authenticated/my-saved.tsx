import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/_authenticated/my-saved")({
  component: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Saved listings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coming in phase 2 — the heart button on listings is already wired up.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    </div>
  ),
});
