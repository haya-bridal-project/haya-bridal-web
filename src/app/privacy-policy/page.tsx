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
            At Haya Premium Bridal Rental, your privacy is paramount. This Privacy Policy details how we collect, handle, and protect your personal information when utilizing our website, booking bridal rentals, or requesting styling appointments.
          </p>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Information We Collect</h2>
            <p>
              We collect your name, email address, contact phone number, delivery address, sizing measurements, and event dates purely to deliver bespoke bridal rental services and fulfill order agreements.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Payment Information Security</h2>
            <p>
              We do not store your credit card numbers, CVVs, or banking passwords on our servers. All financial transactions are securely processed through Razorpay in full PCI-DSS compliance.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Contact & Inquiries</h2>
            <p>
              If you have any questions or data requests regarding our privacy standards, contact us at privacy@hayabridal.com.
            </p>
          </section>
        </div>
      }
    />
  );
}
