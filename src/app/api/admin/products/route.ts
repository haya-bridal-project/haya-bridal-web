import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
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

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    const pricePaise = rupeesToPaise(price_rupees || rental_price_rupees);
    if (pricePaise == null || pricePaise < 0) {
      return NextResponse.json({ error: "Valid purchase price is required." }, { status: 400 });
    }

    const compareAtPricePaise = rupeesToPaise(compare_at_price_rupees);
    const serviceClient = createServiceClient();

    const baseProductData = {
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      collection_id: collection_id || null,
      rental_price_paise: pricePaise,
      rental_duration_days: 1,
      deposit_paise: 0,
      buffer_days: 0,
      compare_at_price_paise: compareAtPricePaise || null,
      short_description: short_description || null,
      description: description || null,
      sizes: Array.isArray(sizes) ? sizes : [],
      colors: Array.isArray(colors) ? colors : [],
      is_published: !!is_published,
      is_featured: !!is_featured,
      care_instructions: care_instructions || null,
      rental_conditions: null,
      seo_title: seo_title || null,
      seo_description: seo_description || null,
    };

    // Try inserting with category and allow_customization
    let productId: string | null = null;
    const { data: prodWithExtra, error: errWithExtra } = await serviceClient
      .from("products")
      .insert({
        ...baseProductData,
        category: category || "dress",
        allow_customization: allow_customization !== false,
        price_paise: pricePaise,
      })
      .select("id")
      .single();

    if (!errWithExtra && prodWithExtra) {
      productId = prodWithExtra.id;
    } else {
      // Fallback if category columns not yet added to DB
      const { data: fallbackProd, error: fallbackError } = await serviceClient
        .from("products")
        .insert(baseProductData)
        .select("id")
        .single();

      if (fallbackError || !fallbackProd) {
        console.error("[admin/products] insert error", fallbackError || errWithExtra);
        return NextResponse.json({ error: (fallbackError || errWithExtra)?.message }, { status: 500 });
      }
      productId = fallbackProd.id;
    }

    // 2. Insert images into product_images table (enforce single primary image)
    if (productId && Array.isArray(images) && images.length > 0) {
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
      const explicitPrimary = typedImages.findIndex((i) => i.is_primary);
      const primaryIdx = explicitPrimary >= 0 ? explicitPrimary : 0;

      const imageRows = typedImages.map((img, idx) => ({
        product_id: productId,
        url: img.url,
        public_id: img.public_id,
        alt: img.alt || name,
        color_name: img.color_name || null,
        is_primary: idx === primaryIdx,
        sort_order: idx,
        width: img.width || null,
        height: img.height || null,
      }));

      const { error: imgError } = await serviceClient.from("product_images").insert(imageRows);
      if (imgError) {
        console.error("[admin/products] image insert error", imgError);
        return NextResponse.json({ error: imgError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id: productId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error creating product" },
      { status: 500 }
    );
  }
}
