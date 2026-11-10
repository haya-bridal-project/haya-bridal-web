import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function OrderPolicyPage() {
  return (
    <PolicyPageLayout
      slug="rental-policy"
      defaultTitle="Bespoke Order &amp; Customization Policy"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Bespoke Purchases &amp; Two Product Categories</h2>
            <p>
              Haya Bridal crafts bespoke bridal dresses and supplies fine bridal ornaments. All items listed in our catalog are handcrafted for direct purchase and customized to each bride&apos;s exact measurements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Custom Tailoring for Dresses</h2>
            <p>
              When purchasing bridal dresses, clients may choose standard sizing or submit bespoke measurements (Bust, Waist, Hips, Shoulder width, and Length) along with specific styling preferences. Our master artisans tailor each bridal piece according to the submitted dimensions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Secure Online Payments (No COD)</h2>
            <p>
              Due to the personalized craftsmanship involved in bridal couture and fine ornaments, all orders are prepaid securely using Cashfree (UPI, Credit/Debit Cards, Net Banking) or coordinated via boutique WhatsApp concierge. Cash on Delivery (COD) is not available.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">4. Crafting, Quality Inspection &amp; Insured Delivery</h2>
            <p>
              Each bespoke creation undergoes meticulous quality checks before dispatch. Orders are packaged in museum-grade bridal garment boxes and shipped with insured, tracked courier services directly to your delivery address.
            </p>
          </section>
        </div>
      }
    />
  );
}
