import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { LegalPage, Section } from "@/components/LegalPage";
import { Mail, MapPin, Clock, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact AutoFie — Get in touch" },
      { name: "description", content: "Reach the AutoFie team in Kumasi, Ghana. Email autofieghana@gmail.com for support, partnerships, dealer verification or press." },
      { property: "og:title", content: "Contact AutoFie" },
      { property: "og:description", content: "Email autofieghana@gmail.com — we respond within one business day." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LegalPage kicker="Contact" title="We'd love to hear from you.">
        <p>
          Whether you're a buyer, a dealer, a partner or a journalist — our team in Kumasi is one email away.
          We read every message and respond within one business day.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <a href="mailto:autofieghana@gmail.com" className="group rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <Mail className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold text-foreground">Email us</p>
            <p className="text-sm text-primary group-hover:underline">autofieghana@gmail.com</p>
            <p className="mt-1 text-xs text-muted-foreground">Best for support, dealer verification and general questions.</p>
          </a>
          <div className="rounded-xl border bg-card p-5">
            <MapPin className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold text-foreground">Visit us</p>
            <p className="text-sm text-foreground/80">Kumasi, Ashanti Region</p>
            <p className="mt-1 text-xs text-muted-foreground">Headquarters — by appointment only.</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <Clock className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold text-foreground">Hours</p>
            <p className="text-sm text-foreground/80">Mon – Fri, 8:00 – 18:00 GMT</p>
            <p className="mt-1 text-xs text-muted-foreground">Sat, 9:00 – 14:00. Closed Sundays and public holidays.</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <MessageCircle className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold text-foreground">In-app chat</p>
            <p className="text-sm text-foreground/80">Already on AutoFie?</p>
            <p className="mt-1 text-xs text-muted-foreground">Use the chat on any listing to reach a dealer directly.</p>
          </div>
        </div>

        <Section title="What to include in your email">
          <ul className="ml-5 list-disc space-y-1">
            <li>Your full name and a phone number we can reach you on.</li>
            <li>The reason you're contacting us (support, dealer verification, partnership, press, etc.).</li>
            <li>If it's about a listing or a dealer — the listing link or dealer name.</li>
            <li>Screenshots if you're reporting a problem.</li>
          </ul>
        </Section>

        <Section title="Report a safety concern">
          <p>
            If you suspect a scam, a fake listing or any abuse on AutoFie, email
            {" "}<a className="font-semibold text-primary hover:underline" href="mailto:autofieghana@gmail.com?subject=Safety%20report">autofieghana@gmail.com</a>{" "}
            with the subject line <em>Safety report</em>. We prioritise these messages.
          </p>
        </Section>
      </LegalPage>

    </div>
  );
}
