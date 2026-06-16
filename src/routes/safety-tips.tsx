import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { LegalPage, Section } from "@/components/LegalPage";
import { AlertTriangle, ShieldCheck, Eye, Banknote, Car, Users } from "lucide-react";

export const Route = createFileRoute("/safety-tips")({
  head: () => ({
    meta: [
      { title: "Safety Tips — Buy and sell vehicles safely in Ghana | AutoFie" },
      { name: "description", content: "Practical safety tips for buying and selling vehicles in Ghana on AutoFie — meet in public, verify documents, inspect in daylight, and avoid common scams." },
      { property: "og:title", content: "Safety Tips — AutoFie" },
      { property: "og:description", content: "Meet in public, verify documents, inspect in daylight, avoid common scams." },
      { property: "og:url", content: "https://autofie.com/safety-tips" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://autofie.com/safety-tips" }],
  }),
  component: SafetyPage,
});

const tips = [
  { icon: ShieldCheck, t: "Deal only with verified dealers", d: "Look for the verification badge before you commit. Verified dealers have provided a valid Ghana Card." },
  { icon: Eye, t: "Inspect in person, in daylight", d: "Always view the vehicle in person, in good light. Bring a mechanic friend if you can." },
  { icon: Car, t: "Test drive before paying", d: "A short test drive reveals more than ten photos. Listen for unusual sounds and check the brakes." },
  { icon: Users, t: "Meet in a public, busy place", d: "Choose a fuel station, dealership or police-friendly area. Don't go alone for first viewings." },
  { icon: Banknote, t: "Use bank transfer, not cash", d: "Avoid carrying large amounts of cash. Prefer bank transfer or mobile money to a verified business account." },
  { icon: AlertTriangle, t: "Never pay before you see the car", d: "Deposits before a viewing are the #1 scam. No genuine dealer will demand money to 'reserve' a vehicle sight unseen." },
];

function SafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LegalPage kicker="Stay safe" title="Safety tips for buyers and sellers" lastUpdated="June 2026">
        <p>
          AutoFie verifies every dealer with their Ghana Card, but you are still your best line of defence.
          Follow these tips to buy or sell with confidence anywhere in Ghana.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {tips.map((tip) => (
            <div key={tip.t} className="rounded-xl border bg-card p-5">
              <tip.icon className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold text-foreground">{tip.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tip.d}</p>
            </div>
          ))}
        </div>

        <Section title="For buyers">
          <ul className="ml-5 list-disc space-y-1">
            <li>Cross-check the vehicle's chassis (VIN), registration number and DVLA records.</li>
            <li>Ask for the original logbook, customs documents (for imports) and service history.</li>
            <li>Be careful of prices that look too good to be true — they almost always are.</li>
            <li>Keep all conversation inside AutoFie chat so there's a record if something goes wrong.</li>
          </ul>
        </Section>

        <Section title="For dealers">
          <ul className="ml-5 list-disc space-y-1">
            <li>Don't share your personal phone or address until you trust the buyer.</li>
            <li>Confirm payments have <em>cleared</em> in your bank account before handing over keys.</li>
            <li>Be wary of buyers who refuse to meet in person or want to ship a vehicle without inspection.</li>
            <li>Use AutoFie chat to keep proof of the conversation.</li>
          </ul>
        </Section>

        <Section title="Red flags to walk away from">
          <ul className="ml-5 list-disc space-y-1">
            <li>Requests to move the conversation off-platform straight away.</li>
            <li>Pressure to pay immediately or "lose the deal".</li>
            <li>Sellers who refuse to meet, refuse a test drive, or refuse to show original documents.</li>
            <li>Payment requests to a personal momo number when you're told it's a registered business.</li>
          </ul>
        </Section>

        <Section title="Report it">
          <p>
            See something off? Email <a className="text-primary hover:underline" href="mailto:autofieghana@gmail.com?subject=Safety%20report">autofieghana@gmail.com</a> with the
            subject <em>Safety report</em> and include the listing link plus screenshots. Our team reviews safety reports first.
          </p>
        </Section>
      </LegalPage>

    </div>
  );
}
