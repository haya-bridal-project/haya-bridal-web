import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  getSiteSettings,
  getHeroSlides,
  getPublishedCollections,
  getFeaturedProducts,
} from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SplashScreen } from "@/components/brand/SplashScreen";
import { Header } from "@/components/storefront/Header";
import { Hero } from "@/components/storefront/Hero";
import { CollectionCards } from "@/components/storefront/CollectionCards";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Footer } from "@/components/storefront/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, heroSlides, collectionsResult, featuredProducts, user] =
    await Promise.all([
      getSiteSettings(),
      getHeroSlides(),
      getPublishedCollections(),
      getFeaturedProducts(8),
      getCurrentUser(),
    ]);

  // Wishlist count for logged-in user
  let wishlistCount = 0;
  if (user) {
    try {
      const supabase = await createClient();
      const { count } = await supabase
        .from("wishlist_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      wishlistCount = count ?? 0;
    } catch {
      // Wishlist table not yet migrated or offline
    }
  }

  const collections = collectionsResult.items;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      {/* 01. Pre-intro Splash Screen matching reference */}
      <SplashScreen
        customLogoUrl={settings.brand.logo_light_url || settings.brand.logo_url}
      />

      {/* 02. Desktop & Mobile Header */}
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user?.email}
        wishlistCount={wishlistCount}
      />

      <main className="flex-1">
        {/* 02. Homepage Hero section */}
        <Hero slides={heroSlides} />

        {/* Four Collection Cards immediately beneath hero */}
        <CollectionCards collections={collections} />

        {/* Featured Collections / Curated Products Section */}
        <section className="py-12 sm:py-16 bg-[#FAF6F0] border-t border-[#E8DDD1]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header matching Reference 02 */}
            <div className="flex items-end justify-between mb-8 sm:mb-10 pb-4 border-b border-[#E8DDD1]">
              <div>
                <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
                  Curated Catalog
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
                  {settings.home?.featured_heading || "Featured Collections"}
                </h2>
              </div>
              <Link
                href="/collections"
                className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#2B211C] hover:text-[#B06F5E] transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Product Grid or Clean Empty State */}
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* Clean empty state as required by prompt when DB is freshly initialized */
              <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-12 text-center max-w-xl mx-auto shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#F4ECE1] text-[#B06F5E] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-xl text-[#2B211C] mb-2 font-normal">
                  Bridal Catalog Preparing
                </h3>
                <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto leading-relaxed font-sans mb-6">
                  The Haya bridal collection is being curated. Authentic designer ensembles and rental slots will appear as soon as they are published by our stylists.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/consultation"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide rounded-sm"
                  >
                    Book Private Consultation
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-transparent border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] text-xs font-medium rounded-sm"
                  >
                    Admin Portal &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Experience & Trust Banner */}
        <section className="py-14 bg-[#F4ECE1] border-y border-[#E8DDD1]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-[#B06F5E]">
              The Haya Promise
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2B211C] max-w-xl mx-auto font-normal mt-2 mb-4">
              Luxury Bridal Elegance Without the Permanent Commitment
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6A5F] max-w-2xl mx-auto leading-relaxed mb-8">
              Every outfit in our rental vault is preserved with museum-grade care, customized to your measurements, professionally dry cleaned, and delivered right on time for your special moment.
            </p>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#2B211C] hover:text-[#B06F5E] border-b border-[#2B211C] hover:border-[#B06F5E] pb-0.5 transition-colors"
            >
              <span>Discover Our Rental Process</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer
        customLogoUrl={settings.brand.logo_url}
        contact={settings.contact}
        social={settings.social}
      />
    </div>
  );
}
