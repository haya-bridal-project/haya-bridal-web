import Link from "next/link";
import {
  Sparkles,
  Layers,
  MessageSquare,
  Clock,
  CheckCircle2,
  CreditCard,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Try RPC first for metrics, fallback to direct counts
  let metrics = {
    published_products: 0,
    total_products: 0,
    collections: 0,
    new_enquiries: 0,
    new_consultations: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    payments_received_paise: 0,
    payments_count: 0,
    upcoming_rentals: 0,
  };

  const { data: rpcMetrics, error: rpcErr } = await supabase.rpc("admin_dashboard_metrics");
  if (!rpcErr && rpcMetrics) {
    metrics = rpcMetrics;
  } else {
    // Direct counts fallback
    const [
      { count: pubProducts },
      { count: allProducts },
      { count: cols },
      { count: enq },
      { count: pendBkg },
      { count: confBkg },
      { data: paymentsData },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("collections").select("*", { count: "exact", head: true }),
      supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["pending_payment", "requested"]),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase.from("payments").select("amount_paise").eq("status", "captured"),
    ]);

    const sumPayments = (paymentsData || []).reduce((acc: number, p: any) => acc + (p.amount_paise || 0), 0);

    metrics = {
      published_products: pubProducts || 0,
      total_products: allProducts || 0,
      collections: cols || 0,
      new_enquiries: enq || 0,
      new_consultations: 0,
      pending_bookings: pendBkg || 0,
      confirmed_bookings: confBkg || 0,
      payments_received_paise: sumPayments,
      payments_count: paymentsData?.length || 0,
      upcoming_rentals: confBkg || 0,
    };
  }

  // Fetch 5 latest bookings for quick action
  const { data: latestBookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const cards = [
    {
      label: "Published Outfits",
      value: metrics.published_products,
      sub: `${metrics.total_products} total in catalog`,
      href: "/admin/products",
      icon: Sparkles,
    },
    {
      label: "Active Collections",
      value: metrics.collections,
      sub: "Boutique categories",
      href: "/admin/collections",
      icon: Layers,
    },
    {
      label: "Pending Bookings",
      value: metrics.pending_bookings,
      sub: "Awaiting confirmation/payment",
      href: "/admin/bookings?status=pending",
      icon: Clock,
    },
    {
      label: "Confirmed Rentals",
      value: metrics.confirmed_bookings,
      sub: `${metrics.upcoming_rentals} upcoming rentals`,
      href: "/admin/bookings?status=confirmed",
      icon: CheckCircle2,
    },
    {
      label: "Payments Verified",
      value: formatINR(metrics.payments_received_paise),
      sub: `${metrics.payments_count} transactions captured`,
      href: "/admin/bookings",
      icon: CreditCard,
    },
    {
      label: "New Client Enquiries",
      value: metrics.new_enquiries,
      sub: "Pending styling reply",
      href: "/admin/enquiries",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
          Executive Summary
        </span>
        <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
          Boutique Performance &amp; Live Metrics
        </h1>
      </div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="p-5 bg-[#FFFDF9] border border-[#E8DDD1] hover:border-[#B06F5E] rounded-sm transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-[#7A6A5F] font-sans">
                  {c.label}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#FAF6F0] text-[#B06F5E] flex items-center justify-center">
                  <Icon className="w-4 h-4 stroke-[1.6]" />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-serif text-[#2B211C] group-hover:text-[#B06F5E] transition-colors">
                {c.value}
              </div>

              <div className="mt-2 text-[11px] text-[#7A6A5F] flex items-center justify-between">
                <span>{c.sub}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#B06F5E] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Latest Bookings Table */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
          <h2 className="font-serif text-xl text-[#2B211C] font-normal">
            Recent Reservation Activity
          </h2>
          <Link
            href="/admin/bookings"
            className="text-xs text-[#B06F5E] hover:underline font-medium"
          >
            Manage All &rarr;
          </Link>
        </div>

        {latestBookings && latestBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-[#7A6A5F] uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Outfit</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
                {latestBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-[#FAF6F0]/60">
                    <td className="py-3 px-3 font-mono font-medium text-[#B06F5E]">
                      {b.reference}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium block">{b.customer_name}</span>
                      <span className="text-[11px] text-[#7A6A5F]">{b.customer_phone}</span>
                    </td>
                    <td className="py-3 px-3 font-serif text-sm">
                      {b.product_name}
                    </td>
                    <td className="py-3 px-3">
                      {formatDate(b.start_date)} &rarr; {formatDate(b.end_date)}
                    </td>
                    <td className="py-3 px-3 font-sans font-semibold">
                      {formatINR(b.total_paise)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-xs bg-[#F4ECE1] text-[11px] font-medium">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/bookings?search=${b.reference}`}
                        className="text-[#B06F5E] hover:underline font-medium"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#7A6A5F]">
            No booking records yet. As customers book outfits online, reservations will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
