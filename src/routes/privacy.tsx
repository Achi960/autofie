import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { LegalPage, Section } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AutoFie" },
      { name: "description", content: "How AutoFie collects, uses and protects your personal information, including Ghana Card verification data, in line with the Ghana Data Protection Act." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LegalPage kicker="Legal" title="Privacy Policy" lastUpdated="June 2026">
        <p>
          AutoFie respects your privacy. This policy explains what information we collect, how we use it and the
          choices you have. It applies to everyone using AutoFie in Ghana and is written to align with the
          <strong> Ghana Data Protection Act, 2012 (Act 843)</strong>.
        </p>

        <Section title="1. Information we collect">
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Account data</strong> — name, email, phone number, password (encrypted).</li>
            <li><strong>Verification data</strong> — Ghana Card number, supporting documents and a selfie for identity matching (dealers only).</li>
            <li><strong>Listing data</strong> — vehicle details, photos, price and region you post.</li>
            <li><strong>Activity data</strong> — listings you view, save or chat about, and basic device/browser information.</li>
            <li><strong>Communications</strong> — messages you send through in-app chat and emails you send us.</li>
          </ul>
        </Section>

        <Section title="2. How we use your information">
          <ul className="ml-5 list-disc space-y-1">
            <li>To verify your identity and prevent fraud on the platform.</li>
            <li>To display your listings and connect you with interested buyers or sellers.</li>
            <li>To improve AutoFie — what's slow, what's broken, what people actually use.</li>
            <li>To send important service updates and, with your consent, occasional product news.</li>
            <li>To comply with our legal obligations in Ghana.</li>
          </ul>
        </Section>

        <Section title="3. Ghana Card and sensitive data">
          <p>We only collect Ghana Card information for dealer verification. It is stored encrypted, used solely to confirm identity, and never shown publicly. We do not sell, rent or share verification data with advertisers.</p>
        </Section>

        <Section title="4. Sharing your information">
          <p>We do not sell your personal information. We share it only with:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Trusted service providers (hosting, analytics, email) bound by confidentiality.</li>
            <li>Law enforcement or regulators when required by Ghanaian law.</li>
            <li>Other users — but only the information you choose to make public (your dealer name, listings, reviews).</li>
          </ul>
        </Section>

        <Section title="5. Your phone number">
          <p>Your phone number is hidden by default. Buyers contact you through in-app chat. You decide if and when to share your number.</p>
        </Section>

        <Section title="6. Data retention">
          <p>We keep your account and verification data for as long as your account is active, and for a reasonable period after closure to meet legal and fraud-prevention obligations. You can request deletion at any time.</p>
        </Section>

        <Section title="7. Security">
          <p>We use encryption in transit (HTTPS), encrypted storage and access controls to protect your data. No system is perfectly secure — please use a strong, unique password and tell us immediately if you suspect a breach.</p>
        </Section>

        <Section title="8. Your rights">
          <p>You have the right to access, correct, delete or export your personal information, and to object to certain uses. To exercise any of these rights, email <a className="text-primary hover:underline" href="mailto:autofieghana@gmail.com">autofieghana@gmail.com</a>.</p>
        </Section>

        <Section title="9. Cookies">
          <p>We use cookies and similar technologies to keep you signed in, remember your preferences and understand how AutoFie is used. You can control cookies in your browser settings.</p>
        </Section>

        <Section title="10. Children">
          <p>AutoFie is not intended for anyone under 18. We do not knowingly collect data from minors.</p>
        </Section>

        <Section title="11. Changes">
          <p>We may update this policy. We will post the new version here and, for material changes, notify you by email or in-app.</p>
        </Section>

        <Section title="12. Contact">
          <p>For privacy questions or to exercise your rights, email <a className="text-primary hover:underline" href="mailto:autofieghana@gmail.com">autofieghana@gmail.com</a>.</p>
        </Section>
      </LegalPage>

    </div>
  );
}
