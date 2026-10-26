import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

export async function POST(request: NextRequest) {
  try {
    const adminCtx = await requireAdmin();
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
      images, // [{ url, public_id, alt, color_name, is_primary }]
      rental_options, // [{ duration_days, price_rupees }]
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    const rentalPricePaise = rupeesToPaise(rental_price_rupees);
    if (rentalPricePaise == null || rentalPricePaise < 0) {
      return NextResponse.json({ error: "Valid rental price is required." }, { status: 400 });
    }

    const depositPaise = rupeesToPaise(deposit_rupees) || 0;

    const serviceClient = createServiceClient();

    // 1. Insert product
    const { data: product, error: pError } = await serviceClient
      .from("products")
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        collection_id: collection_id || null,
        rental_price_paise: rentalPricePaise,
        rental_duration_days: parseInt(rental_duration_days || "3", 10),
        deposit_paise: depositPaise,
        short_description: short_description || null,
        description: description || null,
        sizes: Array.isArray(sizes) ? sizes : [],
        colors: Array.isArray(colors) ? colors : [],
        is_published: !!is_published,
        is_featured: !!is_featured,
        care_instructions: care_instructions || null,
        rental_conditions: rental_conditions || null,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
      })
      .select("id")
      .single();

    if (pError) {
      console.error("[admin/products] insert error", pError);
      return NextResponse.json({ error: pError.message }, { status: 500 });
    }

    const productId = product.id;

    // 2. Insert images into product_images table
    if (Array.isArray(images) && images.length > 0) {
      const imageRows = images.map((img: any, idx: number) => ({
        product_id: productId,
        url: img.url,
        public_id: img.public_id,
        alt: img.alt || name,
        color_name: img.color_name || null,
        is_primary: idx === 0 || !!img.is_primary,
        sort_order: idx,
        width: img.width || null,
        height: img.height || null,
      }));

      await serviceClient.from("product_images").insert(imageRows);
    }

    // 3. Insert additional duration options
    if (Array.isArray(rental_options) && rental_options.length > 0) {
      const optionRows = rental_options.flatMap((opt: any, idx: number) => {
        const paise = rupeesToPaise(opt.price_rupees);
        if (paise == null) return [];
        return [
          {
            product_id: productId,
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

    return NextResponse.json({ ok: true, id: productId });
  } catch (err: unknown) {
    console.error("[admin/products] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
