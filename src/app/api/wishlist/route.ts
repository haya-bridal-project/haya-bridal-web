import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product_id, action } = await request.json();
  if (!product_id) {
    return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
  }

  if (action === "add") {
    const { error } = await supabase.from("wishlist_items").upsert({
      user_id: authData.user.id,
      product_id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", authData.user.id)
      .eq("product_id", product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
