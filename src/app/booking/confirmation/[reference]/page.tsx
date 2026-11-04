import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
import { canAccessOrder } from "@/lib/guest-token";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ConfirmationPageProps {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingConfirmationPage(props: ConfirmationPageProps) {
  const { reference } = await props.params;
  const searchParams = await props.searchParams;
  const token = typeof searchParams.t === "string" ? searchParams.t : null;

  const user = await getCurrentUser();
  const settings = await getSiteSettings();

  const supabase = createServiceClient();
  const { data: bookingData } = await supabase
    .from("bookings")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!bookingData || !canAccessOrder(bookingData as Booking, user?.id, token)) {
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

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-12 lg:py-16 w-full">
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-8 sm:p-12 shadow-xs text-center">
          
          {/* Status Icon */}
          <div className="w-14 h-14 rounded-full bg-[#F4ECE1] text-[#B06F5E] flex items-center justify-center mx-auto mb-5">
            {isPaid ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600 stroke-[1.6]" />
            ) : (
              <Clock className="w-7 h-7 text-[#B06F5E] stroke-[1.6]" />
            )}
          </div>

          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
            {isPaid ? "Payment Successful" : "Order Placed"}
          </span>

          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B211C] font-normal tracking-tight mt-1.5 mb-2.5">
            {isPaid ? "Order Confirmed" : "Order Received"}
          </h1>

          <p className="text-xs sm:text-sm text-[#7A6A5F] max-w-md mx-auto leading-relaxed font-light mb-7">
            {isPaid
              ? `Thank you, ${booking.customer_name}. Your online payment of ${formatINR(booking.total_paise)} was successful. We are carefully packing your piece for insured dispatch.`
              : `Thank you, ${booking.customer_name}. Please complete your online payment to initiate dispatch.`}
          </p>

          {/* Reference Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FAF6F0] px-4 py-2 rounded-xs border border-[#E8DDD1] mb-8 text-xs font-mono text-[#2B211C]">
            <span className="text-[#7A6A5F] font-sans">Order Ref:</span>
            <span className="font-bold text-[#B06F5E]">{booking.reference}</span>
          </div>

          {/* Minimal Order Details Summary */}
          <div className="bg-[#FAF6F0]/80 border border-[#E8DDD1] rounded-xs p-5 sm:p-6 text-left text-xs text-[#7A6A5F] space-y-3 mb-8">
            <div className="flex justify-between items-baseline pb-2.5 border-b border-[#E8DDD1]">
              <span>Purchased Item:</span>
              <strong className="text-[#2B211C] font-serif text-sm text-right">
                {booking.product_name}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Date:</span>
              <span className="text-[#2B211C] font-medium font-sans">
                {formatDate(booking.created_at)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="text-emerald-700 font-medium font-sans">
                {isPaid ? "Paid (Online Payment)" : "Pending"}
              </span>
            </div>

            {booking.customer_address && (
              <div className="pt-2 border-t border-[#E8DDD1]">
                <span className="block font-medium text-[#2B211C] mb-0.5">Shipping Address:</span>
                <p className="text-[#7A6A5F]">{booking.customer_address}</p>
              </div>
            )}

            <div className="flex justify-between pt-2.5 text-sm text-[#2B211C] font-semibold border-t border-[#E8DDD1]">
              <span className="font-serif">Total Paid:</span>
              <span className="text-[#B06F5E] font-bold font-sans">
                {formatINR(booking.total_paise)}
              </span>
            </div>
          </div>

          {/* Minimal Reassurance Box */}
          <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] text-[11px] text-[#7A6A5F] leading-relaxed mb-8 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B06F5E] shrink-0" />
            <span>
              Your jewelry is packaged in tamper-evident luxury casing and dispatched via insured courier.
            </span>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                href="/account/bookings"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Orders</span>
              </Link>
            ) : null}

            <Link
              href="/collections"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] text-xs font-medium tracking-wide uppercase rounded-sm transition-colors"
            >
              <span>Explore More Collections</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
