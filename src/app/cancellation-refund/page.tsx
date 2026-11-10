import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Return, Exchange & Refund Policy",
  description:
    "Return eligibility, non-returnable custom bridal wear and jewellery, 24-hour exchange inspection rules, refund timelines, and rental terms at Haya Bridal.",
  path: "/cancellation-refund",
});

export default function CancellationRefundPage() {
  return (
    <PolicyPageLayout
      slug="cancellation-refund"
      defaultTitle="Return, Exchange & Refund Policy"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p>
            At Haya Bridal, we carefully select and prepare our bridal jewellery and bridal dresses to make your special occasions memorable. Please read our return and exchange policy before placing an order.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Return Policy</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Returns are accepted only for products that are eligible under our return policy.</li>
              <li>Customers must request a return within 48 hours of receiving the product.</li>
              <li>Products must be unused, unworn, undamaged, and returned in their original packaging with all tags and accessories.</li>
              <li>Products showing signs of use, alteration, damage, or missing accessories will not be eligible for return.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Non-Returnable Products</h2>
            <p className="text-[#5A4C42]">The following products are generally not eligible for return or exchange:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Bridal jewellery purchased for special occasions.</li>
              <li>Customised or personalised jewellery.</li>
              <li>Made-to-order bridal dresses.</li>
              <li>Altered or customised outfits.</li>
              <li>Products purchased during clearance or final-sale offers.</li>
              <li>Products damaged due to customer handling or misuse.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Exchange Policy</h2>
            <p className="text-[#5A4C42]">Exchange requests may be considered in the following situations:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Incorrect product delivered.</li>
              <li>Manufacturing defects.</li>
              <li>Product received in damaged condition.</li>
            </ul>
            <p className="text-[#5A4C42] pt-1">
              Customers must contact our support team within 24 hours of delivery with supporting photographs and an unboxing video. All exchanges are subject to product availability and inspection.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">4. Refund Policy</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Refunds will only be processed after the returned product has been inspected and approved.</li>
              <li>Approved refunds will be credited to the original payment method or another mutually agreed payment method.</li>
              <li>Refund processing may take 5&ndash;10 business days, depending on the payment provider or bank.</li>
              <li>Shipping and delivery charges are non-refundable unless the return is due to our mistake or a confirmed defective product.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">5. Rental Products</h2>
            <p className="text-[#5A4C42]">For bridal jewellery and bridal dress rental orders:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Rental booking payments and advance amounts are subject to the cancellation terms agreed at the time of booking.</li>
              <li>Rental products must be returned within the agreed rental period.</li>
              <li>Customers are responsible for loss or damage beyond normal wear and tear during the rental period, subject to the rental agreement.</li>
              <li>Late returns may attract additional rental charges as communicated at the time of booking.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">6. How to Request a Return or Exchange</h2>
            <p className="text-[#5A4C42]">To request a return or exchange, please contact us with:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Order ID.</li>
              <li>Customer name and contact number.</li>
              <li>Reason for return or exchange.</li>
              <li>Clear photographs or an unboxing video, where applicable.</li>
            </ul>
            <p className="text-[#5A4C42] pt-1">
              Our support team will review your request and guide you through the next steps.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">7. Policy Updates</h2>
            <p className="text-[#5A4C42]">
              Haya Bridal reserves the right to update this policy when necessary. Any changes will be published on our website.
            </p>
          </section>

          <div className="pt-4 border-t border-[#E8DDD1] text-[#2B211C]">
            <p className="font-serif italic text-base">
              We appreciate your trust and look forward to making your bridal shopping experience special.
            </p>
          </div>
        </div>
      }
    />
  );
}
