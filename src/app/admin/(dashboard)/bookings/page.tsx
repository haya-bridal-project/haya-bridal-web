import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BookingsManager } from "@/components/admin/BookingsManager";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  let bookings: any[] = [];
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*,payments(*),product:products(id,name,category,product_images(url,is_primary))")
      .order("created_at", { ascending: false });

    if (!error && data) {
      bookings = data;
    } else {
      // Fallback if join is not needed
      const { data: fallbackData } = await supabase
        .from("bookings")
        .select("*,payments(*)")
        .order("created_at", { ascending: false });
      bookings = fallbackData || [];
    }
  } catch {
    bookings = [];
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6A5F]">Loading orders...</div>}>
      <BookingsManager initialBookings={bookings} />
    </Suspense>
  );
}
