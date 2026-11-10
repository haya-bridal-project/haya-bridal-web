import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "How Bespoke Ordering & Customization Works",
  description:
    "Learn how to select your bridal dress or ornaments, submit bespoke custom tailoring measurements, complete secure online payment, and receive insured pan-India delivery.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <PolicyPageLayout
      slug="how-it-works"
      defaultTitle="How Ordering & Customization Works at Haya"
      defaultContent={
        <div className="space-y-8 font-light text-[#2B211C]">
          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              1. Discover Dresses &amp; Fine Ornaments
            </h2>
            <p>
              Explore our curated boutique of handcrafted bridal lehengas, reception couture, and heritage fine jewelry ornaments. Every piece is an authentic creation designed for cherished celebrations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              2. Custom Measurements &amp; Personalized Tailoring
            </h2>
            <p>
              For dresses, choose between standard sizing (XS to XXL) or select <strong>Custom Measurements</strong>. Provide your exact bust, waist, hips, and length requirements along with styling notes (blouse neckline, sleeve length). Our master tailors custom-stitch the garment to your unique silhouette.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              3. 100% Secure Cashfree Online Checkout (No COD)
            </h2>
            <p>
              Prepay securely via our integrated Cashfree payment gateway using UPI (Google Pay, PhonePe, Paytm), Credit &amp; Debit Cards, or NetBanking. Please note that Cash on Delivery (COD) is not available for custom couture garments and fine ornaments.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              4. Master Handcrafting &amp; Quality Inspection
            </h2>
            <p>
              Your ensemble is stitched and embellished with intricate hand embroidery, steam finished to museum standards, and safely packaged in our luxury keepsake trunk.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C]">
              5. Insured Express Doorstep Delivery
            </h2>
            <p>
              We courier your order across India via express insured shipping. Real-time tracking and delivery updates are sent directly to your phone and WhatsApp.
            </p>
          </section>
        </div>
      }
    />
  );
}
