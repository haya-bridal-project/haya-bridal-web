import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/public";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/labels";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomerBookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/bookings");

  const supabase = await createClient();
  const settings = await getSiteSettings();

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = (bookingsData || []) as Booking[];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user.email}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/account" className="hover:text-[#2B211C]">My Account</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Rental Bookings</span>
        </nav>

        <div className="mb-8">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Client Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
            Your Rental Reservations
          </h1>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
          {bookings.length > 0 ? (
            <div className="divide-y divide-[#E8DDD1]">
              {bookings.map((b) => (
                <div key={b.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-[#B06F5E]">
                        {b.reference}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-xs bg-[#F4ECE1] text-[#2B211C]">
                        {BOOKING_STATUS_LABEL[b.status] || b.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg text-[#2B211C] font-normal">
                      {b.product_name}
                    </h3>
                    <p className="text-xs text-[#7A6A5F] mt-1 font-sans">
                      Rental Dates: <strong>{formatDate(b.start_date)}</strong> &rarr; <strong>{formatDate(b.end_date)}</strong> ({b.duration_days} Days)
                      {b.size ? ` • Size: ${b.size}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-0 border-[#E8DDD1]">
                    <div className="text-left md:text-right">
                      <span className="text-sm font-semibold text-[#2B211C] font-sans block">
                        {formatINR(b.total_paise)}
                      </span>
                      <span className="text-[11px] text-[#7A6A5F]">
                        Payment: {PAYMENT_STATUS_LABEL[b.payment_status] || b.payment_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.status === "pending_payment" && (
                        <Link
                          href={`/checkout/${b.reference}`}
                          className="px-4 py-2 bg-[#B06F5E] text-white text-xs font-medium rounded-sm hover:bg-[#975D4E] transition-colors"
                        >
                          Pay Deposit
                        </Link>
                      )}
                      <Link
                        href={`/booking/confirmation/${b.reference}`}
                        className="px-3.5 py-2 bg-[#FAF6F0] hover:bg-[#F4ECE1] border border-[#E8DDD1] text-xs font-medium text-[#2B211C] rounded-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#7A6A5F]">
              <p className="mb-4">No rental bookings on record yet.</p>
              <Link
                href="/collections"
                className="inline-flex px-5 py-2.5 bg-[#B06F5E] text-white rounded-sm font-medium"
              >
                Explore Bridal Collection
              </Link>
            </div>
          )}
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
