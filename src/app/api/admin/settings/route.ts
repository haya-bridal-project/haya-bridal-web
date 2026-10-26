import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
      .from("site_settings")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settingsMap: Record<string, unknown> = {};
    (data || []).forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCtx = await requireAdmin();
    const body = await request.json();
    const serviceClient = createServiceClient();

    // Upsert each setting key-value pair
    const promises = Object.entries(body).map(([key, value]) =>
      serviceClient.from("site_settings").upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: adminCtx.user.id,
        },
        { onConflict: "key" }
      )
    );

    await Promise.all(promises);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 }
    );
  }
}
