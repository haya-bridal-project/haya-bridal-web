import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ShoppingBag,
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
  const isConfirmed = booking.status === "confirmed";

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
            {isConfirmed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 stroke-[1.5]" />
            ) : (
              <Clock className="w-8 h-8 text-[#B06F5E] stroke-[1.5]" />
            )}
          </div>

          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
            {isConfirmed ? "Booking Confirmed" : "Request Received"}
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-2 mb-3">
            {isConfirmed
              ? "Your Bridal Rental is Confirmed"
              : "We Have Received Your Rental Request"}
          </h1>

          <p className="text-xs sm:text-sm text-[#7A6A5F] max-w-lg mx-auto leading-relaxed font-light mb-8">
            {isConfirmed
              ? `Thank you, ${booking.customer_name}. Your payment has been verified and your dates are reserved.`
              : `Thank you, ${booking.customer_name}. Our concierge team is reviewing your requested dates and will contact you via phone or WhatsApp shortly.`}
          </p>

          {/* Reference Pill */}
          <div className="inline-flex items-center gap-2 bg-[#FAF6F0] px-4 py-2 rounded-sm border border-[#E8DDD1] mb-8 text-xs font-mono text-[#2B211C]">
            <span className="text-[#7A6A5F] font-sans">Reference:</span>
            <span className="font-bold text-[#B06F5E]">{booking.reference}</span>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-[#FAF6F0] border border-[#E8DDD1] rounded-xs p-6 text-left text-xs text-[#7A6A5F] space-y-3 mb-8">
            <div className="flex justify-between pb-2 border-b border-[#E8DDD1]">
              <span>Outfit:</span>
              <strong className="text-[#2B211C] font-serif text-sm">
                {booking.product_name}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Rental Period:</span>
              <span className="text-[#2B211C] font-medium font-sans">
                {formatDate(booking.start_date)} &rarr; {formatDate(booking.end_date)} ({booking.duration_days} Days)
              </span>
            </div>
            {booking.size && (
              <div className="flex justify-between">
                <span>Selected Size:</span>
                <span className="text-[#2B211C] font-medium font-sans">{booking.size}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Booking Status:</span>
              <span className="text-[#2B211C] font-medium">
                {BOOKING_STATUS_LABEL[booking.status] || booking.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="text-[#2B211C] font-medium">
                {PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E8DDD1] text-sm text-[#2B211C] font-semibold">
              <span>Total Amount:</span>
              <span className="text-[#B06F5E] font-bold font-sans">
                {formatINR(booking.total_paise)}
              </span>
            </div>
          </div>

          {/* Next Steps Guidance */}
          <div className="text-left mb-8 p-5 bg-[#FFFDF9] border border-[#E8DDD1] rounded-xs space-y-3">
            <h4 className="font-serif text-sm text-[#2B211C] font-medium">
              What Happens Next:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-[#7A6A5F] font-light leading-relaxed">
              <li>
                <strong className="text-[#2B211C] font-normal">Fitting Appointment:</strong> Our master tailor will coordinate a private trial or virtual measurement session.
              </li>
              <li>
                <strong className="text-[#2B211C] font-normal">Garment Preparation:</strong> Your ensemble will undergo museum-standard steaming, custom fitting, and luxury packaging.
              </li>
              <li>
                <strong className="text-[#2B211C] font-normal">Pickup / Delivery:</strong> You may collect your outfit 1 day prior to the rental start date, or we will courier it to your address.
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
              <span>View in My Bookings</span>
            </Link>
            <Link
              href="/collections"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] text-xs font-medium tracking-wide uppercase rounded-sm transition-colors"
            >
              <span>Explore More Outfits</span>
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
