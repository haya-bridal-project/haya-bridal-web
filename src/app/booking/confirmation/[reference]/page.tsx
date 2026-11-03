import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  Truck,
  Scissors,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/labels";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ConfirmationPageProps {
  params: Promise<{ reference: string }>;
}

export default async function BookingConfirmationPage(props: ConfirmationPageProps) {
  const { reference } = await props.params;

  const supabase = await createClient();
  const user = await getCurrentUser();
  const settings = await getSiteSettings();

  const { data: bookingData } = await supabase
    .from("bookings")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!bookingData) {
    notFound();
  }

  const booking = bookingData as Booking;
  const isPaid = booking.payment_status === "paid" || booking.status === "confirmed";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user?.email}
      />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 w-full">
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-8 sm:p-12 shadow-sm text-center">
          
          {/* Status Icon */}
          <div className="w-16 h-16 rounded-full bg-[#F4ECE1] text-[#B06F5E] flex items-center justify-center mx-auto mb-6">
            {isPaid ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 stroke-[1.5]" />
            ) : (
              <Clock className="w-8 h-8 text-[#B06F5E] stroke-[1.5]" />
            )}
          </div>

          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
            {isPaid ? "Order Confirmed & Paid" : "Order Placed (Awaiting Payment)"}
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-2 mb-3">
            {isPaid
              ? "Your Bridal Order is Confirmed"
              : "Order Received - Complete Payment"}
          </h1>

          <p className="text-xs sm:text-sm text-[#7A6A5F] max-w-lg mx-auto leading-relaxed font-light mb-8">
            {isPaid
              ? `Thank you, ${booking.customer_name}. Your payment of ${formatINR(booking.total_paise)} via Razorpay was successful. Our master couturiers are preparing your order.`
              : `Thank you, ${booking.customer_name}. Please complete the payment to initiate custom tailoring and dispatch.`}
          </p>

          {/* Reference Pill */}
          <div className="inline-flex items-center gap-2 bg-[#FAF6F0] px-4 py-2 rounded-sm border border-[#E8DDD1] mb-8 text-xs font-mono text-[#2B211C]">
            <span className="text-[#7A6A5F] font-sans">Order Reference:</span>
            <span className="font-bold text-[#B06F5E]">{booking.reference}</span>
          </div>

          {/* Order Summary Box */}
          <div className="bg-[#FAF6F0] border border-[#E8DDD1] rounded-xs p-6 text-left text-xs text-[#7A6A5F] space-y-3 mb-8">
            <div className="flex justify-between pb-2 border-b border-[#E8DDD1]">
              <span>Purchased Item:</span>
              <strong className="text-[#2B211C] font-serif text-sm">
                {booking.product_name}
              </strong>
            </div>
            {booking.size && (
              <div className="flex justify-between">
                <span>Fit / Size:</span>
                <span className="text-[#2B211C] font-medium font-sans">{booking.size}</span>
              </div>
            )}
            {booking.color && (
              <div className="flex justify-between">
                <span>Color:</span>
                <span className="text-[#2B211C] font-medium">{booking.color}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Order Status:</span>
              <span className="text-[#2B211C] font-medium">
                {BOOKING_STATUS_LABEL[booking.status] || booking.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Gateway:</span>
              <span className="text-[#2B211C] font-medium">
                {PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}
              </span>
            </div>
            {booking.customer_address && (
              <div className="pt-2 border-t border-[#E8DDD1]">
                <span className="block font-medium text-[#2B211C] mb-0.5">Shipping Destination:</span>
                <p>{booking.customer_address}</p>
              </div>
            )}
            {booking.notes && (
              <div className="pt-2 border-t border-[#E8DDD1] bg-white/70 p-2.5 rounded-xs">
                <span className="block font-medium text-[#2B211C] mb-0.5">Customization &amp; Notes:</span>
                <p>{booking.notes}</p>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[#E8DDD1] text-xs">
              <span>Insured Shipping:</span>
              <span className="font-medium text-[#2B211C]">
                {formatINR(booking.fees_paise || 0)}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-sm text-[#2B211C] font-semibold border-t border-[#E8DDD1]/60">
              <span>Total Paid:</span>
              <span className="text-[#B06F5E] font-bold font-sans">
                {formatINR(booking.total_paise)}
              </span>
            </div>
          </div>

          {/* Next Steps Guidance */}
          <div className="text-left mb-8 p-5 bg-[#FFFDF9] border border-[#E8DDD1] rounded-xs space-y-3">
            <h4 className="font-serif text-sm text-[#2B211C] font-medium">
              What Happens Next with Your Order:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-[#7A6A5F] font-light leading-relaxed">
              <li>
                <strong className="text-[#2B211C] font-normal">Customization &amp; Stitching:</strong> Our artisans review your measurements and begin tailoring the ensemble.
              </li>
              <li>
                <strong className="text-[#2B211C] font-normal">Quality &amp; Luxury Packaging:</strong> The completed piece undergoes hand inspection, steaming, and placement in our protective garment trunk.
              </li>
              <li>
                <strong className="text-[#2B211C] font-normal">Doorstep Express Delivery:</strong> Shipped via insured courier. Tracking details will be dispatched to your WhatsApp ({booking.customer_phone}).
              </li>
            </ol>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/account/bookings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View My Orders</span>
            </Link>
            <Link
              href="/collections"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] text-xs font-medium tracking-wide uppercase rounded-sm transition-colors"
            >
              <span>Explore More Collections</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </main>

      <Footer
        customLogoUrl={settings.brand.logo_url}
        contact={settings.contact}
        social={settings.social}
      />
    </div>
  );
}
