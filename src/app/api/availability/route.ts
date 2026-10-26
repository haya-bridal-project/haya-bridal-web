import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";
import { isIsoDate } from "@/lib/dates";

export async function GET(request: NextRequest) {
  if (!isConfigured.supabase()) {
    return NextResponse.json({ available: false, reason: "Database offline" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");
  const start = searchParams.get("start");
  const duration = parseInt(searchParams.get("duration") || "3", 10);

  if (!productId || !start || !isIsoDate(start) || isNaN(duration) || duration < 1) {
    return NextResponse.json(
      { available: false, reason: "Invalid parameters" },
      { status: 400 }
    );
  }

  const db = createPublicClient();
  const { data, error } = await db.rpc("check_availability", {
    p_product_id: productId,
    p_start: start,
    p_duration: duration,
  });

  if (error) {
    // If migration is not yet run, handle gracefully
    if (error.code === "42883" || error.code === "PGRST202") {
      return NextResponse.json({ available: true, units: 1 });
    }
    return NextResponse.json({ available: false, reason: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
