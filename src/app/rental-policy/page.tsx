import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function RentalPolicyPage() {
  return (
    <PolicyPageLayout
      slug="rental-policy"
      defaultTitle="Rental Terms & Policy"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Rental Period & Buffer Days</h2>
            <p>
              Haya offers rental durations of 3, 5, or 7 days starting from your scheduled delivery or studio pickup date. Every rental includes automated buffer days reserved in our studio for professional alteration, steaming, and post-event museum-grade cleaning.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Security Deposit</h2>
            <p>
              A refundable security deposit is charged at the time of reservation. The deposit is held as security against irreversible fabric damage or failure to return the garment. Upon physical inspection following return, the entire deposit is automatically refunded to your original payment method.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Alterations & Fitting</h2>
            <p>
              Standard alterations (blouse side hooks, waist tie adjustments, and minor hem pin-ups) are performed by Haya’s in-house master tailor. Customers must not cut fabric, use safety pins that tear silk, or attempt external alterations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">4. Dry Cleaning & Stains</h2>
            <p>
              Normal celebration wear (dust along the inner border, minor perfume or makeup marks) is completely covered by Haya’s complimentary cleaning service. Do NOT dry-clean or wash the outfit yourself. In the rare event of major burns, wine saturation, or tears, repair fees may be deducted from the security deposit.
            </p>
          </section>
        </div>
      }
    />
  );
}
