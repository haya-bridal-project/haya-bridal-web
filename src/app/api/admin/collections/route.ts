import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, slug, tagline, description, image_url, image_public_id, show_on_home, is_published, sort_order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from("collections")
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        tagline: tagline || null,
        description: description || null,
        image_url: image_url || null,
        image_public_id: image_public_id || null,
        show_on_home: !!show_on_home,
        is_published: !!is_published,
        sort_order: parseInt(sort_order || "0", 10),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
