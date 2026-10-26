import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function CancellationRefundPage() {
  return (
    <PolicyPageLayout
      slug="cancellation-refund"
      defaultTitle="Cancellation & Refund Policy"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">1. Cancellation Timelines</h2>
            <p>
              Bridal rentals involve date-locking rare couture garments that cannot be reserved by other clients once blocked.
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7A6A5F] mt-2">
              <li><strong>More than 14 days prior to rental start:</strong> 100% refund of the rental charge and full security deposit.</li>
              <li><strong>Between 7 and 14 days prior to rental start:</strong> 50% refund of the rental charge; 100% refund of the security deposit.</li>
              <li><strong>Less than 7 days prior to rental start:</strong> The rental charge is non-refundable (as custom alterations have commenced); 100% of the security deposit is refunded immediately.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">2. Security Deposit Refund Process</h2>
            <p>
              Once your garment is received at our studio or collected by our courier, our quality team inspects the outfit within 24–48 hours. The refundable deposit is released immediately via Razorpay to your original bank account or card. Standard bank processing timelines apply.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg text-[#2B211C]">3. Date Rescheduling</h2>
            <p>
              In case your event date changes, please contact the Haya concierge at least 10 days in advance. Rescheduling to a new date is permitted subject to outfit availability without additional charges.
            </p>
          </section>
        </div>
      }
    />
  );
}
