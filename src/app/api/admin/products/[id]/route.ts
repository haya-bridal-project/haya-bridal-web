import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, props: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const body = await request.json();

    const {
      name,
      slug,
      collection_id,
      rental_price_rupees,
      rental_duration_days,
      deposit_rupees,
      short_description,
      description,
      sizes,
      colors,
      is_published,
      is_featured,
      care_instructions,
      rental_conditions,
      seo_title,
      seo_description,
      images,
      rental_options,
    } = body;

    const rentalPricePaise = rupeesToPaise(rental_price_rupees);
    const depositPaise = rupeesToPaise(deposit_rupees);

    const serviceClient = createServiceClient();

    // 1. Update product
    const updatePayload: Record<string, any> = {};
    if (name) updatePayload.name = name.trim();
    if (slug) updatePayload.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    updatePayload.collection_id = collection_id || null;
    if (rentalPricePaise != null) updatePayload.rental_price_paise = rentalPricePaise;
    if (rental_duration_days) updatePayload.rental_duration_days = parseInt(rental_duration_days, 10);
    if (depositPaise != null) updatePayload.deposit_paise = depositPaise;
    updatePayload.short_description = short_description || null;
    updatePayload.description = description || null;
    if (Array.isArray(sizes)) updatePayload.sizes = sizes;
    if (Array.isArray(colors)) updatePayload.colors = colors;
    if (typeof is_published === "boolean") updatePayload.is_published = is_published;
    if (typeof is_featured === "boolean") updatePayload.is_featured = is_featured;
    updatePayload.care_instructions = care_instructions || null;
    updatePayload.rental_conditions = rental_conditions || null;
    updatePayload.seo_title = seo_title || null;
    updatePayload.seo_description = seo_description || null;

    const { error: pError } = await serviceClient
      .from("products")
      .update(updatePayload)
      .eq("id", id);

    if (pError) {
      return NextResponse.json({ error: pError.message }, { status: 500 });
    }

    // 2. Sync images if provided
    if (Array.isArray(images)) {
      await serviceClient.from("product_images").delete().eq("product_id", id);
      if (images.length > 0) {
        const imageRows = images.map((img: any, idx: number) => ({
          product_id: id,
          url: img.url,
          public_id: img.public_id,
          alt: img.alt || name || "",
          color_name: img.color_name || null,
          is_primary: !!img.is_primary,
          sort_order: idx,
        }));
        await serviceClient.from("product_images").insert(imageRows);
      }
    }

    // 3. Sync rental duration options if provided
    if (Array.isArray(rental_options)) {
      await serviceClient.from("product_rental_options").delete().eq("product_id", id);
      const optionRows = rental_options.flatMap((opt: any, idx: number) => {
        const paise = rupeesToPaise(opt.price_rupees);
        if (paise == null) return [];
        return [
          {
            product_id: id,
            duration_days: parseInt(opt.duration_days, 10),
            price_paise: paise,
            sort_order: idx,
          },
        ];
      });

      if (optionRows.length > 0) {
        await serviceClient.from("product_rental_options").insert(optionRows);
      }
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
    // Safe archive or soft delete
    const { error } = await serviceClient
      .from("products")
      .update({ is_archived: true, is_published: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
