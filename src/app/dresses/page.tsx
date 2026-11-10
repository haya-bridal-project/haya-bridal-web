import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
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
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Bespoke Bridal Dresses & Couture Lehengas",
  description:
    "Explore our handcrafted bridal gowns, bespoke wedding lehengas, and couture bridal ensembles. Custom sizing tailored to your exact measurements with doorstep delivery across India.",
  path: "/dresses",
});

interface DressesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DressesPage(props: DressesPageProps) {
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
      getFacets(null, "dress"),
      listProducts({
        category: "dress",
        sort,
        colors,
        sizes,
        minPaise: minPrice,
        maxPaise: maxPrice,
        q,
        page,
        pageSize: 24,
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
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">
            Bridal Dresses
          </span>
        </nav>

        {/* 2-column layout: Sidebar Filter (left) + Main Product Grid (right) */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
          {/* Left Sidebar Filter (locked to dresses) */}
          <CollectionFilterSidebar
            collections={collections}
            facets={facets}
            totalCount={totalCount}
            hideCategoryFilter={true}
          />

          {/* Right Product Grid Area */}
          <div className="flex-1 w-full min-w-0">
            {/* Header with Title and Sorting */}
            <CollectionSortHeader
              title="Bespoke Bridal Dresses"
              totalCount={totalCount}
            />

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6 mt-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-[#FFFDF9] rounded-sm border border-[#E8DDD1] p-8 my-6">
                <h3 className="font-serif text-xl text-[#2B211C] mb-2 font-normal">
                  No bridal dresses found
                </h3>
                <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto leading-relaxed">
                  We could not find any dresses matching your selected filters. Try resetting the filters or searching for another keyword.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dresses"
                    className="inline-block px-5 py-2.5 bg-[#B06F5E] text-white text-xs font-medium uppercase tracking-wider rounded-sm hover:bg-[#975D4E] transition-colors shadow-xs"
                  >
                    Reset Filters
                  </Link>
                </div>
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

