import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  Calendar,
  LogOut,
  User,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/public";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { BOOKING_STATUS_LABEL } from "@/lib/labels";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const supabase = await createClient();
  const settings = await getSiteSettings();

  // Fetch customer's profile and recent bookings
  const [{ data: profile }, { data: bookingsData }, { count: wishlistCount }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("wishlist_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const bookings = (bookingsData || []) as Booking[];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user.email}
        wishlistCount={wishlistCount || 0}
      />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 w-full">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 mb-8 border-b border-[#E8DDD1] gap-4">
          <div>
            <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
              Client Dashboard
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
              Welcome, {profile?.full_name || user.email?.split("@")[0]}
            </h1>
            <p className="text-xs text-[#7A6A5F] mt-1 font-sans">
              Signed in as {user.email}
            </p>
          </div>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] text-xs font-medium rounded-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link
            href="/account/bookings"
            className="p-5 bg-[#FFFDF9] border border-[#E8DDD1] hover:border-[#B06F5E] rounded-sm transition-all shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#F4ECE1] text-[#B06F5E] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 stroke-[1.6]" />
              </div>
              <div>
                <span className="font-serif text-base text-[#2B211C] block group-hover:text-[#B06F5E]">
                  Rental Bookings
                </span>
                <span className="text-xs text-[#7A6A5F]">
                  {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A6A5F] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/account/wishlist"
            className="p-5 bg-[#FFFDF9] border border-[#E8DDD1] hover:border-[#B06F5E] rounded-sm transition-all shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#F4ECE1] text-[#B06F5E] flex items-center justify-center">
                <Heart className="w-5 h-5 stroke-[1.6]" />
              </div>
              <div>
                <span className="font-serif text-base text-[#2B211C] block group-hover:text-[#B06F5E]">
                  Saved Wishlist
                </span>
                <span className="text-xs text-[#7A6A5F]">
                  {wishlistCount || 0} saved outfits
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A6A5F] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/consultation"
            className="p-5 bg-[#FFFDF9] border border-[#E8DDD1] hover:border-[#B06F5E] rounded-sm transition-all shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#F4ECE1] text-[#B06F5E] flex items-center justify-center">
                <Calendar className="w-5 h-5 stroke-[1.6]" />
              </div>
              <div>
                <span className="font-serif text-base text-[#2B211C] block group-hover:text-[#B06F5E]">
                  Bespoke Consultation
                </span>
                <span className="text-xs text-[#7A6A5F]">
                  Book Studio Trial
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A6A5F] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Recent Bookings Section */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C] font-normal">
              Recent Rental Bookings
            </h2>
            <Link
              href="/account/bookings"
              className="text-xs text-[#B06F5E] hover:underline font-medium"
            >
              View All &rarr;
            </Link>
          </div>

          {bookings.length > 0 ? (
            <div className="divide-y divide-[#E8DDD1]">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <span className="font-mono text-xs text-[#B06F5E] font-medium block">
                      {b.reference}
                    </span>
                    <h3 className="font-serif text-base text-[#2B211C] font-normal mt-0.5">
                      {b.product_name}
                    </h3>
                    <p className="text-xs text-[#7A6A5F] mt-0.5">
                      {formatDate(b.start_date)} to {formatDate(b.end_date)} ({b.duration_days} Days)
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-start sm:self-auto">
                    <div className="text-right">
                      <span className="font-sans font-semibold text-sm text-[#2B211C] block">
                        {formatINR(b.total_paise)}
                      </span>
                      <span className="text-[11px] text-[#7A6A5F] capitalize">
                        {BOOKING_STATUS_LABEL[b.status] || b.status}
                      </span>
                    </div>

                    <Link
                      href={`/booking/confirmation/${b.reference}`}
                      className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#F4ECE1] border border-[#E8DDD1] text-xs font-medium text-[#2B211C] rounded-sm transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-[#7A6A5F]">
              <p>You have not placed any rental reservations yet.</p>
              <Link
                href="/collections"
                className="mt-4 inline-flex items-center px-4 py-2 bg-[#B06F5E] text-white rounded-sm text-xs font-medium"
              >
                Browse Bridal Outfits
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
