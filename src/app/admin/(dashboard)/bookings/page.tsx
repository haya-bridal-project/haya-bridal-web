import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/public";
import { BookingsManager } from "@/components/admin/BookingsManager";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const serviceClient = createServiceClient();

  // Self-heal: Ensure any booking with payment_status = 'paid' is marked confirmed
  try {
    await serviceClient
      .from("bookings")
      .update({ status: "confirmed", hold_expires_at: null })
      .eq("payment_status", "paid")
      .eq("status", "pending_payment");
  } catch (syncErr) {
    console.error("[admin/orders] self-heal sync error", syncErr);
  }

  const [settings, bookingsResult] = await Promise.all([
    getSiteSettings(),
    (async () => {
      try {
        const { data, error } = await serviceClient
          .from("bookings")
          .select("*,payments(*),product:products(id,name,category,product_images(url,is_primary))")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data;
        }

        const { data: fallbackData } = await serviceClient
          .from("bookings")
          .select("*,payments(*)")
          .order("created_at", { ascending: false });
        return fallbackData || [];
      } catch (err) {
        console.error("[admin/orders] fetch error", err);
        return [];
      }
    })(),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6A5F]">Loading orders...</div>}>
      <BookingsManager initialBookings={bookingsResult} siteSettings={settings} />
    </Suspense>
  );
}
