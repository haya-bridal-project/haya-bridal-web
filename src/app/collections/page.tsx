import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
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

export const metadata: Metadata = {
  title: "Collections & All Creations — Haya Bridal Couture & Fine Ornaments",
  description:
    "Explore our signature bridal collections alongside our complete catalog of bespoke dresses, couture lehengas, and handcrafted fine ornaments.",
};

interface CollectionsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CollectionsPage(props: CollectionsPageProps) {
  const searchParams = await props.searchParams;

  const category = typeof searchParams.category === "string" ? searchParams.category : null;
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
        category,
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
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-8 font-sans">
          <Link href="/" className="hover:text-[#2B211C] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">
            Collections &amp; All Products
          </span>
        </nav>

        {/* 01. Signature Collections Showcase Section */}
        {collections.length > 0 && (
          <section className="mb-14 pb-12 border-b border-[#E8DDD1]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
              <div>
                <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
                  Curated Portfolios
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
                  Our Signature Collections
                </h2>
              </div>
              <p className="text-xs text-[#7A6A5F] max-w-md font-sans leading-relaxed">
                Explore our curated bridal couture ensembles, handcrafted lehengas, and fine heirloom jewelry collections.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group relative aspect-[4/3] rounded-sm overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-end p-5"
                >
                  {col.image_url ? (
                    <>
                      <Image
                        src={col.image_url}
                        alt={col.image_alt || col.name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F4ECE1] to-[#E8DDD1]" />
                  )}

                  <div className="relative z-10 flex items-end justify-between">
                    <div>
                      <h3
                        className={`font-serif text-lg font-normal tracking-tight ${
                          col.image_url ? "text-[#FFFDF9]" : "text-[#2B211C]"
                        }`}
                      >
                        {col.name}
                      </h3>
                      {col.tagline && (
                        <p
                          className={`text-xs mt-0.5 line-clamp-1 font-sans ${
                            col.image_url ? "text-[#FFFDF9]/85" : "text-[#7A6A5F]"
                          }`}
                        >
                          {col.tagline}
                        </p>
                      )}
                    </div>

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-2 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        col.image_url
                          ? "bg-white/20 text-[#FFFDF9] backdrop-blur-xs group-hover:bg-[#B06F5E] group-hover:text-white"
                          : "bg-[#B06F5E] text-white"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 02. All Products Catalog Section */}
        <div>
          {/* 2-column layout: Sidebar Filter (left) + Main Product Grid (right) */}
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
            {/* Left Sidebar Filter */}
            <CollectionFilterSidebar
              collections={collections}
              facets={facets}
              totalCount={totalCount}
            />

            {/* Right Product Grid Area */}
            <div className="flex-1 w-full min-w-0">
              {/* Header with Title and Sorting */}
              <CollectionSortHeader
                title={
                  category === "dress"
                    ? "Bespoke Bridal Dresses"
                    : category === "ornament"
                    ? "Heritage Fine Ornaments"
                    : "All Creations & Products"
                }
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
                    No products found
                  </h3>
                  <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto leading-relaxed">
                    We could not find any products matching your selected filters. Try resetting the filters or searching for another keyword.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/collections"
                      className="inline-block px-5 py-2.5 bg-[#B06F5E] text-white text-xs font-medium uppercase tracking-wider rounded-sm hover:bg-[#975D4E] transition-colors shadow-xs"
                    >
                      Reset All Filters
                    </Link>
                  </div>
                </div>
              )}
            </div>
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
