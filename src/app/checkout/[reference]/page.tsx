import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/public";
import { isConfigured } from "@/lib/env";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { RazorpayCheckoutWidget } from "@/components/storefront/RazorpayCheckoutWidget";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  params: Promise<{ reference: string }>;
}

export default async function CheckoutPage(props: CheckoutPageProps) {
  const { reference } = await props.params;

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/checkout/${reference}`);
  }

  const { data: bookingData } = await supabase
    .from("bookings")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!bookingData) {
    notFound();
  }

  const booking = bookingData as Booking;

  // If already confirmed or paid, go to confirmation
  if (booking.payment_status === "paid" || booking.status === "confirmed") {
    redirect(`/booking/confirmation/${reference}`);
  }

  const settings = await getSiteSettings();
  const razorpayReady = isConfigured.razorpay();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user.email}
      />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C]">Home</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Secure Checkout</span>
        </nav>

        <div className="mb-6">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Secure Payment
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
            Complete Your Rental Deposit & Booking
          </h1>
        </div>

        <RazorpayCheckoutWidget
          booking={booking}
          razorpayReady={razorpayReady}
          razorpayKeyId={process.env.RAZORPAY_KEY_ID || ""}
        />
      </main>

      <Footer
        customLogoUrl={settings.brand.logo_url}
        contact={settings.contact}
        social={settings.social}
      />
    </div>
  );
}
