import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BookingsManager } from "@/components/admin/BookingsManager";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  let bookings: Booking[] = [];
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*,payments(*),events:booking_events(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      bookings = data as Booking[];
    }
  } catch {
    bookings = [];
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6A5F]">Loading bookings...</div>}>
      <BookingsManager initialBookings={bookings} />
    </Suspense>
  );
}
