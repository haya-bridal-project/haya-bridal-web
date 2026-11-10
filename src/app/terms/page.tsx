import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms & Conditions",
  description:
    "Terms and conditions for bespoke bridal orders, custom tailoring measurements, and insured courier delivery at Haya Bridal Couture.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PolicyPageLayout
      slug="terms"
      defaultTitle="Terms and Conditions"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p>
            Welcome to Haya Bridal Couture. By accessing our platform, ordering handcrafted bridal wear, or purchasing fine ornaments, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Bespoke Orders &amp; Craftsmanship</h2>
            <p>
              Every bridal lehenga and gown is handcrafted with authentic embroidery techniques (zardozi, kundan, sequins, and threadwork). Slight artisanal variations in weave and handwork celebrate the uniqueness of bespoke couture.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Tailoring &amp; Measurements</h2>
            <p>
              Custom fitting measurements provided by clients are verified by our master tailors prior to cutting and stitching. Clients are advised to ensure accurate silhouette dimensions during consultation and order placement.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Dispatch &amp; Delivery</h2>
            <p>
              All orders are shipped via insured express courier across India. Delivery timeframes and dispatch tracking are communicated promptly via WhatsApp and email.
            </p>
          </section>
        </div>
      }
    />
  );
}
