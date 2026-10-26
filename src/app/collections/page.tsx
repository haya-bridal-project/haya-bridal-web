import { Suspense } from "react";
import Link from "next/link";
import {
  getSiteSettings,
  getPublishedCollections,
  listProducts,
  getFacets,
} from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CollectionFilterSidebar } from "@/components/storefront/CollectionFilterSidebar";
import { CollectionSortHeader } from "@/components/storefront/CollectionSortHeader";

export const dynamic = "force-dynamic";

interface CollectionsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CollectionsPage(props: CollectionsPageProps) {
  const searchParams = await props.searchParams;

  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "latest";
  const colors = Array.isArray(searchParams.color)
    ? searchParams.color
    : typeof searchParams.color === "string"
    ? [searchParams.color]
    : [];
  const sizes = Array.isArray(searchParams.size)
    ? searchParams.size
    : typeof searchParams.size === "string"
    ? [searchParams.size]
    : [];
  const minPrice = typeof searchParams.min_price === "string" ? Number(searchParams.min_price) * 100 : null;
  const maxPrice = typeof searchParams.max_price === "string" ? Number(searchParams.max_price) * 100 : null;
  const q = typeof searchParams.q === "string" ? searchParams.q : null;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;

  const [settings, collectionsResult, facets, productsResult, user] =
    await Promise.all([
      getSiteSettings(),
      getPublishedCollections(),
      getFacets(null),
      listProducts({
        sort,
        colors,
        sizes,
        minPaise: minPrice,
        maxPaise: maxPrice,
        q,
        page,
        pageSize: 20,
      }),
      getCurrentUser(),
    ]);

  const collections = collectionsResult.items;
  const products = productsResult.items;
  const totalCount = productsResult.total;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user?.email}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        {/* Breadcrumb matching Reference 04 */}
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">All Collections</span>
        </nav>

        {/* 2-column layout: Sidebar Filter (left) + Main Product Grid (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Filter Sidebar */}
          <div className="lg:col-span-3">
            <Suspense fallback={<div className="h-40 bg-white/40 animate-pulse rounded-sm" />}>
              <CollectionFilterSidebar
                collections={collections}
                facets={facets}
                totalCount={totalCount}
              />
            </Suspense>
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-9">
            <Suspense fallback={<div className="h-10 bg-white/40 animate-pulse rounded-sm mb-4" />}>
              <CollectionSortHeader
                title={q ? `Search: "${q}"` : "All Collections"}
                totalCount={totalCount}
              />
            </Suspense>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-12 text-center shadow-xs">
                <h3 className="font-serif text-xl text-[#2B211C] mb-2 font-normal">
                  No Outfits Found
                </h3>
                <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto mb-6">
                  {q
                    ? `No bridal ensembles match your search for "${q}". Try clearing filters.`
                    : "No published outfits match your selected criteria."}
                </p>
                <Link
                  href="/collections"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#B06F5E] text-white text-xs font-medium rounded-sm"
                >
                  Clear All Filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer
        customLogoUrl={settings.brand.logo_url}
        contact={settings.contact}
        social={settings.social}
      />
    </div>
  );
}
