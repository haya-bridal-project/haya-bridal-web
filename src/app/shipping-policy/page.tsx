import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery & Shipping Policy — Haya Bridal",
  description:
    "Order processing times, Kerala & pan-India delivery estimates, insured shipping charges, order tracking, and delivery support at Haya Bridal.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPageLayout
      slug="shipping-policy"
      defaultTitle="Delivery & Shipping Policy"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p>
            At Haya Bridal, we understand how special your bridal moments are. We take great care to ensure that your bridal jewellery and bridal outfits reach you safely, securely, and on time.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Order Processing</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Orders are processed within 1&ndash;3 business days after payment confirmation.</li>
              <li>Customised, made-to-order, or specially prepared bridal products may require additional processing time.</li>
              <li>Customers will receive an order confirmation after successful placement.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Delivery Time</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Within Kerala: Approximately 2&ndash;5 business days.</li>
              <li>Other locations in India: Approximately 4&ndash;8 business days.</li>
              <li>Remote locations may require additional delivery time.</li>
            </ul>
            <p className="text-[#7A6A5F] pt-1">
              Delivery timelines are estimates and may vary depending on the courier service and location.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Shipping Charges</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5A4C42]">
              <li>Shipping charges, if applicable, will be displayed at checkout.</li>
              <li>Free shipping may be available on selected orders or promotional offers.</li>
              <li>Additional charges may apply for express delivery.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">4. Order Tracking</h2>
            <p className="text-[#5A4C42]">
              Once your order has been dispatched, tracking details will be shared through SMS, WhatsApp, or email, wherever available.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">5. Delivery Responsibility</h2>
            <p className="text-[#5A4C42]">
              Customers are requested to provide accurate delivery addresses and contact numbers. We are not responsible for delays caused by incorrect addresses, unavailable recipients, courier disruptions, or unforeseen circumstances.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">6. Damaged or Missing Products</h2>
            <p className="text-[#5A4C42]">
              Please inspect your package upon delivery. If you receive a damaged, incorrect, or incomplete order, contact us within 24 hours of delivery with clear photographs or an unboxing video.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">7. Bridal &amp; Special Occasion Orders</h2>
            <p className="text-[#5A4C42]">
              Customers are advised to place bridal orders well in advance of their wedding or special occasion to avoid last-minute delivery issues.
            </p>
          </section>

          <div className="pt-4 border-t border-[#E8DDD1] space-y-2 text-[#5A4C42]">
            <p>
              For delivery-related enquiries, please contact us through our website, WhatsApp, or customer support email.
            </p>
            <p className="font-serif italic text-base text-[#2B211C]">
              Thank you for choosing Haya Bridal. We are honoured to be part of your special moments.
            </p>
          </div>
        </div>
      }
    />
  );
}

