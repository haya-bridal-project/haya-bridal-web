import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";
import type {
  Collection,
  ContentPage,
  HeroSlide,
  ProductWithImages,
  PromoBanner,
  RentalOption,
  SiteSettings,
  SizeGuide,
} from "@/lib/types";

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: { site_name: "Haya", tagline: "Premium Bridal Rental", logo_url: null, logo_public_id: null, logo_light_url: null, logo_light_public_id: null },
  contact: { email: null, phone: null, whatsapp: null, address: null, hours: null, map_url: null },
  social: { instagram: null, facebook: null, pinterest: null, youtube: null },
  home: {
    highlights: [],
    show_collection_cards: true,
    show_featured_collections: true,
    show_featured_products: true,
    featured_heading: "Featured Collections",
    products_heading: "Curated For You",
  },
  booking: { workflow: "request", hold_minutes: 20, request_hold_hours: 48, buffer_days: 2, min_lead_days: 1, max_advance_days: 365, fees_paise: 0 },
  product_services: { items: [] },
  email: { admin_notification_email: null },
};

export type DataIssue = { kind: "not_configured" | "schema_missing" | "error"; message: string } | null;

function classify(err: { code?: string; message?: string } | null): DataIssue {
  if (!err) return null;
  if (err.code === "42P01" || err.code === "PGRST205" || /does not exist|schema cache/i.test(err.message ?? ""))
    return { kind: "schema_missing", message: "Database tables are not installed yet. Run the Supabase migration." };
  console.error("[data]", err.code, err.message);
  return { kind: "error", message: "Content is temporarily unavailable." };
}

function client() {
  if (!isConfigured.supabase()) return null;
  return createPublicClient();
}

export const getSiteSettings = cache(async (): Promise<SiteSettings & { _issue: DataIssue }> => {
  const db = client();
  if (!db) return { ...DEFAULT_SETTINGS, _issue: { kind: "not_configured", message: "Supabase is not configured." } };
  const { data, error } = await db.from("site_settings").select("key,value");
  const merged = structuredClone(DEFAULT_SETTINGS) as SiteSettings;
  for (const row of data ?? []) {
    const k = row.key as keyof SiteSettings;
    if (k in merged) (merged as Record<string, unknown>)[k] = { ...(merged[k] as object), ...(row.value as object) };
  }
  return { ...merged, _issue: classify(error) };
});

const PRODUCT_CARD_SELECT =
  "id,name,slug,short_description,rental_price_paise,compare_at_price_paise,rental_duration_days,deposit_paise,quantity,colors,sizes,is_featured,sort_order,collection_id,created_at,product_images(id,url,public_id,alt,sort_order,is_primary,color_name,width,height),collection:collections(id,name,slug)";

export const getHeroSlides = cache(async (): Promise<HeroSlide[]> => {
  const db = client();
  if (!db) return [];
  const { data, error } = await db.from("hero_slides").select("*").eq("is_published", true).order("sort_order").limit(6);
  classify(error);
  return (data as HeroSlide[]) ?? [];
});

export const getPromoBanners = cache(async (): Promise<PromoBanner[]> => {
  const db = client();
  if (!db) return [];
  const { data, error } = await db.from("promo_banners").select("*").eq("is_published", true).order("sort_order").limit(4);
  classify(error);
  return (data as PromoBanner[]) ?? [];
});

export const getPublishedCollections = cache(async (): Promise<{ items: Collection[]; issue: DataIssue }> => {
  const db = client();
  if (!db) return { items: [], issue: { kind: "not_configured", message: "Supabase is not configured." } };
  const { data, error } = await db.from("collections").select("*").eq("is_published", true).order("sort_order").order("name");
  return { items: (data as Collection[]) ?? [], issue: classify(error) };
});

export const getCollectionBySlug = cache(async (slug: string): Promise<Collection | null> => {
  const db = client();
  if (!db) return null;
  const { data } = await db.from("collections").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return (data as Collection) ?? null;
});

export function sortImages<T extends { sort_order: number; is_primary: boolean }>(imgs: T[] | null | undefined): T[] {
  return [...(imgs ?? [])].sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1));
}

export const getFeaturedProducts = cache(async (limit = 8): Promise<ProductWithImages[]> => {
  const db = client();
  if (!db) return [];
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_published", true)
    .eq("is_archived", false)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(limit);
  classify(error);
  return ((data as unknown as ProductWithImages[]) ?? []).map((p) => ({ ...p, product_images: sortImages(p.product_images) }));
});

export type ListingQuery = {
  collectionId?: string | null;
  sort?: string;
  minPaise?: number | null;
  maxPaise?: number | null;
  colors?: string[];
  sizes?: string[];
  start?: string | null;
  end?: string | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
};

export async function listProducts(qry: ListingQuery): Promise<{ items: ProductWithImages[]; total: number; issue: DataIssue }> {
  const db = client();
  if (!db) return { items: [], total: 0, issue: { kind: "not_configured", message: "Supabase is not configured." } };
  const pageSize = qry.pageSize ?? 12;
  const page = Math.max(1, qry.page ?? 1);

  let availableIds: string[] | null = null;
  if (qry.start && qry.end) {
    const { data, error } = await db.rpc("available_product_ids", { p_start: qry.start, p_end: qry.end });
    if (error) return { items: [], total: 0, issue: classify(error) };
    availableIds = ((data as unknown as string[]) ?? []).map((r) => (typeof r === "string" ? r : (r as { available_product_ids: string }).available_product_ids));
    if (availableIds.length === 0) return { items: [], total: 0, issue: null };
  }

  let query = db
    .from("products")
    .select(PRODUCT_CARD_SELECT, { count: "exact" })
    .eq("is_published", true)
    .eq("is_archived", false);

  if (qry.collectionId) query = query.eq("collection_id", qry.collectionId);
  if (qry.minPaise != null) query = query.gte("rental_price_paise", qry.minPaise);
  if (qry.maxPaise != null) query = query.lte("rental_price_paise", qry.maxPaise);
  if (qry.sizes?.length) query = query.overlaps("sizes", qry.sizes);
  if (qry.colors?.length) query = query.overlaps("color_names", qry.colors);
  if (availableIds) query = query.in("id", availableIds);
  if (qry.q) {
    const term = qry.q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,short_description.ilike.%${term}%`);
  }

  switch (qry.sort) {
    case "price_asc":
      query = query.order("rental_price_paise", { ascending: true });
      break;
    case "price_desc":
      query = query.order("rental_price_paise", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "featured":
      query = query.order("is_featured", { ascending: false }).order("sort_order");
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  return {
    items: ((data as unknown as ProductWithImages[]) ?? []).map((p) => ({ ...p, product_images: sortImages(p.product_images) })),
    total: count ?? 0,
    issue: classify(error),
  };
}

/** Distinct filter facets derived from real published products. */
export async function getFacets(collectionId?: string | null) {
  const db = client();
  if (!db) return { colors: [], sizes: [], maxPaise: 0 };
  let q = db.from("products").select("colors,sizes,rental_price_paise").eq("is_published", true).eq("is_archived", false).limit(1000);
  if (collectionId) q = q.eq("collection_id", collectionId);
  const { data } = await q;
  const colors = new Map<string, string>();
  const sizes = new Set<string>();
  let maxPaise = 0;
  for (const r of (data ?? []) as { colors: { name: string; hex: string }[]; sizes: string[]; rental_price_paise: number }[]) {
    for (const c of r.colors ?? []) if (c?.name) colors.set(c.name, c.hex);
    for (const s of r.sizes ?? []) sizes.add(s);
    maxPaise = Math.max(maxPaise, r.rental_price_paise);
  }
  const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];
  return {
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
    sizes: [...sizes].sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    }),
    maxPaise,
  };
}

export const getProductBySlug = cache(async (slug: string) => {
  const db = client();
  if (!db) return null;
  const { data, error } = await db
    .from("products")
    .select("*,product_images(*),collection:collections(id,name,slug),product_rental_options(*),size_guide:size_guides(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .maybeSingle();
  classify(error);
  if (!data) return null;
  const p = data as unknown as ProductWithImages & { product_rental_options: RentalOption[]; size_guide: SizeGuide | null };
  return {
    ...p,
    product_images: sortImages(p.product_images),
    product_rental_options: [...(p.product_rental_options ?? [])].sort((a, b) => a.duration_days - b.duration_days),
  };
});

export async function getRelatedProducts(collectionId: string | null, excludeId: string, limit = 4) {
  const db = client();
  if (!db || !collectionId) return [];
  const { data } = await db
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_published", true)
    .eq("is_archived", false)
    .eq("collection_id", collectionId)
    .neq("id", excludeId)
    .order("sort_order")
    .limit(limit);
  return ((data as unknown as ProductWithImages[]) ?? []).map((p) => ({ ...p, product_images: sortImages(p.product_images) }));
}

export const getContentPage = cache(async (slug: string): Promise<ContentPage | null> => {
  const db = client();
  if (!db) return null;
  const { data } = await db.from("content_pages").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return (data as ContentPage) ?? null;
});

export const getSizeGuides = cache(async (): Promise<SizeGuide[]> => {
  const db = client();
  if (!db) return [];
  const { data } = await db.from("size_guides").select("*").order("name");
  return (data as SizeGuide[]) ?? [];
});
