import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function CancellationRefundPage() {
  return (
    <PolicyPageLayout
      slug="cancellation-refund"
      defaultTitle="Cancellation &amp; Refund Policy"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Bespoke Bridal Dress Orders</h2>
            <p>
              Bespoke bridal dresses and customized lehengas are hand-tailored to the customer&apos;s personal measurements and design preferences. Cancellation requests can be accommodated within 24 hours of order placement before fabric cutting and embroidery have commenced.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Fine Ornaments Return &amp; Replacement</h2>
            <p>
              Fine ornaments and jewelry pieces are inspected for authentic craftsmanship before dispatch in secured luxury packaging. If any item arrives damaged in transit or defective, please contact our concierge within 48 hours of delivery with photos for an immediate replacement or full refund.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Refund Processing Timelines</h2>
            <p>
              Eligible refunds are processed directly through our secure payment gateway to your original payment method (UPI, netbanking, or card) within 5–7 business days.
            </p>
          </section>
        </div>
      }
    />
  );
}
