import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";
import { getCanonicalSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/collections", changeFrequency: "daily", priority: 0.9 },
  { path: "/dresses", changeFrequency: "daily", priority: 0.9 },
  { path: "/ornaments", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.7 },
  { path: "/size-guide", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/enquiry", changeFrequency: "monthly", priority: 0.7 },
  { path: "/shipping-policy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/cancellation-refund", changeFrequency: "monthly", priority: 0.5 },
  { path: "/rental-policy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getCanonicalSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: r.path === "/" ? siteUrl : `${siteUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  if (!isConfigured.supabase()) {
    return entries;
  }

  try {
    const db = createPublicClient();
    const [{ data: collections }, { data: products }] = await Promise.all([
      db
        .from("collections")
        .select("slug, updated_at")
        .eq("is_published", true),
      db
        .from("products")
        .select("slug, updated_at")
        .eq("is_published", true)
        .eq("is_archived", false),
    ]);

    for (const c of collections ?? []) {
      entries.push({
        url: `${siteUrl}/collections/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const p of products ?? []) {
      entries.push({
        url: `${siteUrl}/products/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  } catch (err) {
    console.error("[sitemap] failed to fetch dynamic entries", err);
  }

  return entries;
}

