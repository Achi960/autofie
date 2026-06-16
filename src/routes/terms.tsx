import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { LegalPage, Section } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — AutoFie" },
      { name: "description", content: "The rules for using AutoFie, Ghana's verified vehicle marketplace. Read our terms covering accounts, listings, conduct, payments and disputes." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LegalPage kicker="Legal" title="Terms & Conditions" lastUpdated="June 2026">
        <p>
          These Terms govern your use of AutoFie ("AutoFie", "we", "our", "us"), a vehicle marketplace operated from
          Kumasi, Ghana. By creating an account, posting a listing or browsing AutoFie you agree to these Terms.
          If you do not agree, please do not use the service.
        </p>

        <Section title="1. Eligibility">
          <p>You must be at least 18 years old and legally able to enter into binding contracts under Ghanaian law. Dealers must hold a valid Ghana Card and, where applicable, a registered business.</p>
        </Section>

        <Section title="2. Your account">
          <p>You are responsible for your account, the accuracy of the information you provide and any activity that happens under it. Keep your password secure and notify us immediately at <a className="text-primary hover:underline" href="mailto:autofieghana@gmail.com">autofieghana@gmail.com</a> if you suspect unauthorised access.</p>
        </Section>

        <Section title="3. Listings">
          <p>You may only list vehicles, parts, accessories or services that you legally own or are authorised to sell. Listings must be accurate, include genuine photos and a fair price. We may reject, edit or remove listings that violate these Terms or our community standards.</p>
        </Section>

        <Section title="4. Verification">
          <p>Dealers are verified using Ghana Card and supporting documentation. Verification confirms identity — it is not a guarantee of vehicle condition, ownership or price. Buyers are responsible for inspecting any vehicle before purchase.</p>
        </Section>

        <Section title="5. Acceptable use">
          <ul className="ml-5 list-disc space-y-1">
            <li>No fraudulent, misleading or duplicate listings.</li>
            <li>No harassment, hate speech or unlawful content in chat or reviews.</li>
            <li>No attempts to bypass verification or impersonate another person.</li>
            <li>No scraping, reverse engineering or interference with the platform.</li>
          </ul>
        </Section>

        <Section title="6. Transactions and payments">
          <p>AutoFie connects buyers and sellers. We are not a party to the sale and do not currently process payments. All inspections, negotiations and payments happen directly between the buyer and the dealer. We strongly recommend in-person inspection and bank transfers over cash where possible.</p>
        </Section>

        <Section title="7. Reviews and reputation">
          <p>Reviews must reflect genuine experiences. Fake, paid or retaliatory reviews are not allowed and will be removed. Repeated abuse may result in account suspension.</p>
        </Section>

        <Section title="8. Fees">
          <p>Browsing and basic posting on AutoFie are free. We may introduce optional paid features (such as promoted listings) in future, and we will communicate any changes clearly before they apply.</p>
        </Section>

        <Section title="9. Intellectual property">
          <p>The AutoFie name, logo, designs and software are owned by us. Listing content you upload remains yours; you grant us a non-exclusive licence to display it on AutoFie for the purpose of running the marketplace.</p>
        </Section>

        <Section title="10. Disclaimers">
          <p>AutoFie is provided "as is". We do not warrant the condition, legality or fitness for purpose of any vehicle listed. To the maximum extent permitted by Ghanaian law, we are not liable for indirect or consequential losses arising from your use of the service.</p>
        </Section>

        <Section title="11. Termination">
          <p>We may suspend or terminate accounts that breach these Terms or pose a risk to other users. You can close your account at any time by contacting us.</p>
        </Section>

        <Section title="12. Governing law">
          <p>These Terms are governed by the laws of the Republic of Ghana. Disputes will be subject to the exclusive jurisdiction of the courts in Kumasi.</p>
        </Section>

        <Section title="13. Changes to these Terms">
          <p>We may update these Terms from time to time. Material changes will be announced on the site. Continued use after changes means you accept the updated Terms.</p>
        </Section>

        <Section title="14. Contact">
          <p>Questions? Email <a className="text-primary hover:underline" href="mailto:autofieghana@gmail.com">autofieghana@gmail.com</a>.</p>
        </Section>
      </LegalPage>

    </div>
  );
}
