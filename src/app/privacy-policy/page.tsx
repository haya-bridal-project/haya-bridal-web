import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageLayout
      slug="privacy-policy"
      defaultTitle="Privacy Policy"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p>
            At Haya Bridal Couture, your privacy is paramount. This Privacy Policy details how we collect, handle, and protect your personal information when utilizing our website, ordering handcrafted bridal wear, purchasing fine ornaments, or requesting styling consultations.
          </p>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Information We Collect</h2>
            <p>
              We collect your name, email address, contact phone number, delivery address, sizing measurements, and event dates purely to deliver bespoke bridal couture, coordinate master tailoring, and fulfill order agreements.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Payment Information Security</h2>
            <p>
              We do not store your credit card numbers, CVVs, or banking credentials on our servers. All financial transactions are securely processed through Cashfree in full PCI-DSS compliance with 256-bit encryption.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Contact &amp; Inquiries</h2>
            <p>
              If you have any questions or data requests regarding our privacy standards, contact us at privacy@hayabridal.com.
            </p>
          </section>
        </div>
      }
    />
  );
}
