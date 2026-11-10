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
      category,
      allow_customization,
      collection_id,
      price_rupees,
      rental_price_rupees,
      compare_at_price_rupees,
      short_description,
      description,
      sizes,
      colors,
      is_published,
      is_featured,
      care_instructions,
      seo_title,
      seo_description,
      images,
    } = body;

    const pricePaise = rupeesToPaise(price_rupees || rental_price_rupees);
    const compareAtPaise = rupeesToPaise(compare_at_price_rupees);

    const serviceClient = createServiceClient();

    // 1. Update product
    const updatePayload: Record<string, unknown> = {};
    if (name) updatePayload.name = name.trim();
    if (slug) updatePayload.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    updatePayload.collection_id = collection_id || null;
    if (pricePaise != null) {
      updatePayload.rental_price_paise = pricePaise;
      updatePayload.price_paise = pricePaise;
    }
    if (compareAtPaise !== undefined) {
      updatePayload.compare_at_price_paise = compareAtPaise;
    }
    if (category) updatePayload.category = category;
    if (typeof allow_customization === "boolean") updatePayload.allow_customization = allow_customization;
    updatePayload.short_description = short_description || null;
    updatePayload.description = description || null;
    if (Array.isArray(sizes)) updatePayload.sizes = sizes;
    if (Array.isArray(colors)) updatePayload.colors = colors;
    if (typeof is_published === "boolean") updatePayload.is_published = is_published;
    if (typeof is_featured === "boolean") updatePayload.is_featured = is_featured;
    updatePayload.care_instructions = care_instructions || null;
    updatePayload.seo_title = seo_title || null;
    updatePayload.seo_description = seo_description || null;

    const res = await serviceClient.from("products").update(updatePayload).eq("id", id);
    let pError = res.error;

    if (pError && pError.code === "PGRST204") {
      // If category / allow_customization column not yet in DB schema, retry without them
      delete updatePayload.category;
      delete updatePayload.allow_customization;
      delete updatePayload.price_paise;
      const retryRes = await serviceClient.from("products").update(updatePayload).eq("id", id);
      pError = retryRes.error;
    }

    if (pError) {
      return NextResponse.json({ error: pError.message }, { status: 500 });
    }

    // 2. Sync images if provided (enforce single primary image)
    if (Array.isArray(images)) {
      type ImgInput = {
        url: string;
        public_id: string;
        alt?: string;
        color_name?: string;
        is_primary?: boolean;
        width?: number;
        height?: number;
      };
      const typedImages = images as ImgInput[];
      await serviceClient.from("product_images").delete().eq("product_id", id);
      if (typedImages.length > 0) {
        const explicitPrimary = typedImages.findIndex((i) => i.is_primary);
        const primaryIdx = explicitPrimary >= 0 ? explicitPrimary : 0;

        const imageRows = typedImages.map((img, idx) => ({
          product_id: id,
          url: img.url,
          public_id: img.public_id,
          alt: img.alt || name || "",
          color_name: img.color_name || null,
          is_primary: idx === primaryIdx,
          sort_order: idx,
          width: img.width || null,
          height: img.height || null,
        }));
        const { error: imgError } = await serviceClient.from("product_images").insert(imageRows);
        if (imgError) {
          return NextResponse.json({ error: imgError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error updating product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, props: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await props.params;
    const serviceClient = createServiceClient();

    // Soft delete: set is_archived = true
    const { error } = await serviceClient
      .from("products")
      .update({ is_archived: true, is_published: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error deleting product" },
      { status: 500 }
    );
  }
}
