import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <PolicyPageLayout
      slug="terms"
      defaultTitle="Terms and Conditions"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p>
            Welcome to Haya Premium Bridal Rental. By accessing our platform, reserving outfits, or visiting our boutique studio, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Rental Ownership</h2>
            <p>
              All garments, accessories, packaging, and hangers provided by Haya remain the exclusive property of Haya Premium Bridal Rental. The transaction represents a temporary rental license for the specified dates and cannot be transferred or subleased.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Identity & Verification</h2>
            <p>
              Prior to garment dispatch or handover, clients may be required to verify their government-issued identity (Aadhaar / Passport) to validate rental reservations and security coverage.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Late Returns</h2>
            <p>
              Late returns impact consecutive brides who have reserved the outfit. A late fee equal to the daily rental rate may apply for every 24-hour delay unless authorized in writing by the Haya concierge.
            </p>
          </section>
        </div>
      }
    />
  );
}
