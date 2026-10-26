import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, props: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const body = await request.json();

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from("collections")
      .update({
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.slug ? { slug: body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") } : {}),
        tagline: body.tagline || null,
        description: body.description || null,
        image_url: body.image_url || null,
        image_public_id: body.image_public_id || null,
        show_on_home: typeof body.show_on_home === "boolean" ? body.show_on_home : true,
        is_published: typeof body.is_published === "boolean" ? body.is_published : true,
        sort_order: parseInt(body.sort_order || "0", 10),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    const serviceClient = createServiceClient();
    const { error } = await serviceClient.from("collections").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
