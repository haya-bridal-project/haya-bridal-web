import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function HowItWorksPage() {
  return (
    <PolicyPageLayout
      slug="how-it-works"
      defaultTitle="How Rental Works at Haya"
      defaultContent={
        <div className="space-y-8 font-light text-[#2B211C]">
          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              1. Discover & Reserve
            </h2>
            <p>
              Browse our curated vault of designer bridal lehengas, couture gowns, and celebration ensembles. Select your size, desired rental duration (3, 5, or 7 days), and event date to reserve your outfit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              2. Custom Fitting & Alterations
            </h2>
            <p>
              Every rental includes complimentary blouse and waist alteration. Our master bridal tailor coordinates your exact measurements so your ensemble drapes with bespoke perfection.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              3. Studio Pickup or White-Glove Delivery
            </h2>
            <p>
              Your outfit arrives steamed, spotlessly sanitized, and protected in a luxury garment case 1 day prior to your rental start date.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              4. Celebrate Unforgettably
            </h2>
            <p>
              Wear your designer outfit with pure confidence. Savor every moment knowing your look reflects authentic haute couture craftsmanship.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              5. Effortless Return & Deposit Refund
            </h2>
            <p>
              On the final rental day, simply pack the outfit into its case. We handle all professional dry-cleaning. Your security deposit is promptly released to your account upon return verification.
            </p>
          </section>
        </div>
      }
    />
  );
}
