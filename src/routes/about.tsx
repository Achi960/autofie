import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalPage, Section } from "@/components/LegalPage";
import { ShieldCheck, MapPin, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AutoFie — Ghana's Verified Vehicle Marketplace" },
      { name: "description", content: "AutoFie is a Ghana-built marketplace connecting verified vehicle dealers with serious buyers across all 16 regions. Learn our story, mission and values." },
      { property: "og:title", content: "About AutoFie" },
      { property: "og:description", content: "A Ghana-built, identity-verified vehicle marketplace headquartered in Kumasi." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LegalPage kicker="About us" title="Built in Ghana, for Ghana." lastUpdated="June 2026">
        <p>
          AutoFie is a homegrown vehicle marketplace headquartered in <strong>Kumasi, Ashanti Region</strong>.
          We exist for one reason: to make buying and selling vehicles in Ghana safer, faster and more transparent.
          Too many Ghanaians have lost time and money to fake adverts, anonymous sellers and middlemen who add no value.
          We are changing that.
        </p>

        <Section title="Our mission">
          <p>
            To become the most trusted vehicle marketplace in Ghana by verifying every dealer with their
            Ghana Card before they can post, and by giving buyers the tools to chat, compare and decide with confidence.
          </p>
        </Section>

        <Section title="What makes us different">
          <ul className="grid gap-4 sm:grid-cols-2">
            <li className="rounded-xl border bg-card p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">Verified dealers only</p>
              <p className="text-sm text-muted-foreground">Every dealer is identity-checked. No anonymous sellers.</p>
            </li>
            <li className="rounded-xl border bg-card p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">All 16 regions covered</p>
              <p className="text-sm text-muted-foreground">From Accra to Wa — find vehicles wherever you are.</p>
            </li>
            <li className="rounded-xl border bg-card p-4">
              <Users className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">In-app chat</p>
              <p className="text-sm text-muted-foreground">Talk to dealers privately. Your number stays hidden until you share it.</p>
            </li>
            <li className="rounded-xl border bg-card p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">Free to post</p>
              <p className="text-sm text-muted-foreground">List a vehicle in under 2 minutes. No hidden fees.</p>
            </li>
          </ul>
        </Section>

        <Section title="Our story">
          <p>
            AutoFie was started by a small team of Ghanaian builders who were tired of seeing friends and family
            scammed online. We sat down in Kumasi and asked one question: what would a marketplace look like if
            <em> trust came first</em>? The answer became AutoFie — a platform where verification is the default,
            not the exception.
          </p>
        </Section>

        <Section title="Where we are going">
          <p>
            We are starting with vehicles because it is where trust matters most — the amounts are large and the
            decisions are personal. From here we will expand into parts, accessories, services and beyond, always
            with the same standard: every seller verified, every buyer protected.
          </p>
          <p>
            Want to be part of it? <Link to="/contact" className="font-semibold text-primary hover:underline">Get in touch</Link>.
          </p>
        </Section>
      </LegalPage>
      <SiteFooter />
    </div>
  );
}
