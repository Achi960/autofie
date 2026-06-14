import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/_authenticated/messages")({
  component: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">Real-time chat is coming in phase 2.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    </div>
  ),
});
