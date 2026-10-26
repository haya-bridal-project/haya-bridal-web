import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action, slide, settings } = body;

    const serviceClient = createServiceClient();

    if (action === "save_slide") {
      if (slide.id) {
        // Update slide
        const { error } = await serviceClient
          .from("hero_slides")
          .update({
            eyebrow: slide.eyebrow,
            heading: slide.heading,
            body: slide.body,
            cta_label: slide.cta_label,
            cta_href: slide.cta_href,
            side_text: slide.side_text,
            image_url: slide.image_url,
            image_public_id: slide.image_public_id,
            is_published: !!slide.is_published,
            sort_order: parseInt(slide.sort_order || "0", 10),
          })
          .eq("id", slide.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        // Insert new slide
        const { error } = await serviceClient.from("hero_slides").insert({
          eyebrow: slide.eyebrow,
          heading: slide.heading,
          body: slide.body,
          cta_label: slide.cta_label,
          cta_href: slide.cta_href,
          side_text: slide.side_text,
          image_url: slide.image_url,
          image_public_id: slide.image_public_id,
          is_published: !!slide.is_published,
          sort_order: parseInt(slide.sort_order || "0", 10),
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    } else if (action === "delete_slide") {
      await serviceClient.from("hero_slides").delete().eq("id", body.slideId);
      return NextResponse.json({ ok: true });
    } else if (action === "save_settings") {
      // Update site_settings
      for (const [key, val] of Object.entries(settings)) {
        await serviceClient
          .from("site_settings")
          .upsert({ key, value: val }, { onConflict: "key" });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
