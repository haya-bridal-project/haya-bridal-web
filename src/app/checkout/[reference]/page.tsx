import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/public";
import { env, isConfigured } from "@/lib/env";
import { canAccessOrder } from "@/lib/guest-token";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { CashfreeCheckoutWidget } from "@/components/storefront/CashfreeCheckoutWidget";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Checkout",
  robots: { index: false, follow: false },
};

interface CheckoutPageProps {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutPage(props: CheckoutPageProps) {
  const { reference } = await props.params;
  const searchParams = await props.searchParams;
  const token = typeof searchParams.t === "string" ? searchParams.t : null;
  const initialOrderId =
    typeof searchParams.cf_order_id === "string"
      ? searchParams.cf_order_id
      : typeof searchParams.order_id === "string"
        ? searchParams.order_id
        : null;

  const user = await getCurrentUser();

  if (!isConfigured.serviceRole()) notFound();
  const { data: bookingData } = await createServiceClient()
    .from("bookings")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  // Guests and logged-in customers can both pay; only the owner / token holder may view.
  if (!bookingData || !canAccessOrder(bookingData as Booking, user?.id, token)) {
    notFound();
  }

  const booking = bookingData as Booking;

  // If already confirmed or paid, go to confirmation
  if (booking.payment_status === "paid" || booking.status === "confirmed") {
    redirect(`/booking/confirmation/${reference}${token ? `?t=${token}` : ""}`);
  }

  const settings = await getSiteSettings();
  const cashfreeReady = isConfigured.cashfree();
  const cashfreeMode = cashfreeReady ? env.cashfree().mode : "sandbox";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user?.email}
      />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C]">Home</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Secure Online Checkout</span>
        </nav>

        <div className="mb-6">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Secure Online Payment
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
            Complete Your Order Payment
          </h1>
        </div>

        <CashfreeCheckoutWidget
          booking={booking}
          cashfreeReady={cashfreeReady}
          cashfreeMode={cashfreeMode}
          accessToken={token}
          initialOrderId={initialOrderId}
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
