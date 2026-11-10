import Link from "next/link";
import {
  Package,
  Layers,
  MessageSquare,
  Clock,
  CheckCircle2,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/money";
import { BOOKING_STATUS_LABEL } from "@/lib/labels";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = createServiceClient();

  let metrics = {
    published_products: 0,
    total_products: 0,
    collections: 0,
    new_enquiries: 0,
    pending_orders: 0,
    confirmed_orders: 0,
    payments_received_paise: 0,
    payments_count: 0,
  };

  try {
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
      supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["confirmed", "picked_up", "returned", "completed"]),
      supabase.from("payments").select("amount_paise").eq("status", "captured"),
    ]);

    const sumPayments = (paymentsData || []).reduce(
      (acc: number, p: { amount_paise?: number | null }) => acc + (p.amount_paise || 0),
      0
    );

    metrics = {
      published_products: pubProducts || 0,
      total_products: allProducts || 0,
      collections: cols || 0,
      new_enquiries: enq || 0,
      pending_orders: pendBkg || 0,
      confirmed_orders: confBkg || 0,
      payments_received_paise: sumPayments,
      payments_count: paymentsData?.length || 0,
    };
  } catch {}

  // Fetch 5 latest orders for quick action
  let latestOrders: Booking[] = [];
  try {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    latestOrders = (data as Booking[]) || [];
  } catch {}

  const cards = [
    {
      label: "Live Catalog Products",
      value: metrics.published_products,
      sub: `${metrics.total_products} total dresses & ornaments`,
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Active Collections",
      value: metrics.collections,
      sub: "Curated collections",
      href: "/admin/collections",
      icon: Layers,
    },
    {
      label: "Pending Orders",
      value: metrics.pending_orders,
      sub: "Awaiting payment / processing",
      href: "/admin/bookings?status=awaiting_payment",
      icon: Clock,
    },
    {
      label: "Confirmed & In Production",
      value: metrics.confirmed_orders,
      sub: "Paid and tailoring pipeline",
      href: "/admin/bookings?status=confirmed",
      icon: CheckCircle2,
    },
    {
      label: "Cashfree Revenue",
      value: formatINR(metrics.payments_received_paise),
      sub: `${metrics.payments_count} transactions verified`,
      href: "/admin/bookings",
      icon: CreditCard,
    },
    {
      label: "New Client Inquiries",
      value: metrics.new_enquiries,
      sub: "Styling assistance requested",
      href: "/admin/enquiries",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
          Executive Boutique Dashboard
        </span>
        <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
          Store Operations &amp; Live Sales
        </h1>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="p-4 sm:p-5 bg-[#FFFDF9] border border-[#E8DDD1] hover:border-[#B06F5E] rounded-sm transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-[#7A6A5F] font-sans">
                  {c.label}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#FAF6F0] text-[#B06F5E] flex items-center justify-center shrink-0">
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

      {/* Latest Orders Table */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
          <div>
            <h2 className="font-serif text-lg sm:text-xl text-[#2B211C] font-normal">
              Recent Client Orders &amp; Customizations
            </h2>
            <p className="text-xs text-[#7A6A5F] mt-0.5">
              Live orders prepaid via Cashfree gateway
            </p>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs text-[#B06F5E] hover:underline font-medium"
          >
            Manage All Orders &rarr;
          </Link>
        </div>

        {latestOrders && latestOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-[#7A6A5F] uppercase tracking-wider font-sans border-b border-[#E8DDD1]">
                <tr>
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3">Fit / Size</th>
                  <th className="py-2.5 px-3">Total Paid</th>
                  <th className="py-2.5 px-3">Order Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
                {latestOrders.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-[#B06F5E]">
                      {b.reference}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium block">{b.customer_name}</span>
                      <span className="text-[11px] text-[#7A6A5F]">{b.customer_phone}</span>
                    </td>
                    <td className="py-3 px-3 font-serif">
                      {b.product_name}
                    </td>
                    <td className="py-3 px-3 text-[#7A6A5F]">
                      {b.size || "Standard"}
                    </td>
                    <td className="py-3 px-3 font-sans font-semibold">
                      {formatINR(b.total_paise)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-xs bg-[#F4ECE1] text-[10px] font-medium text-[#2B211C]">
                        {BOOKING_STATUS_LABEL[b.status as keyof typeof BOOKING_STATUS_LABEL] || b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/bookings?search=${encodeURIComponent(b.reference)}`}
                        className="text-[#B06F5E] hover:underline font-medium"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#7A6A5F]">
            No customer orders received yet.
          </div>
        )}
      </div>
    </div>
  );
}
