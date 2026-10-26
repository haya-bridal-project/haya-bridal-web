import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getRelatedProducts,
  getSiteSettings,
} from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductDetailGallery } from "@/components/storefront/ProductDetailGallery";
import { ProductBookingWidget } from "@/components/storefront/ProductBookingWidget";
import { ProductCard } from "@/components/storefront/ProductCard";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found — Haya" };

  return {
    title: `${product.seo_title || product.name} — Haya Premium Bridal Rental`,
    description:
      product.seo_description ||
      product.short_description ||
      `Rent ${product.name} from Haya Premium Bridal Rental.`,
  };
}

export default async function ProductDetailPage(props: ProductPageProps) {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const [settings, relatedProducts, user] = await Promise.all([
    getSiteSettings(),
    getRelatedProducts(product.collection_id, product.id, 4),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user?.email}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full pb-28 sm:pb-12">
        {/* Breadcrumbs matching Reference 05 */}
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-8 font-sans overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#2B211C] transition-colors">
            Home
          </Link>
          <span>/</span>
          {product.collection ? (
            <>
              <Link
                href={`/collections/${product.collection.slug}`}
                className="hover:text-[#2B211C] transition-colors"
              >
                {product.collection.name}
              </Link>
              <span>/</span>
            </>
          ) : (
            <>
              <Link href="/collections" className="hover:text-[#2B211C] transition-colors">
                Collections
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#2B211C] font-medium">{product.name}</span>
        </nav>

        {/* Main Product Showcase Grid (Desktop 2-col, Mobile stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Gallery Column (Left matching Reference 05) */}
          <div className="lg:col-span-7">
            <ProductDetailGallery
              images={product.product_images}
              productName={product.name}
            />

            {/* Additional Garment Specifications / Care accordion or card */}
            {(product.care_instructions || product.rental_conditions) && (
              <div className="mt-10 p-6 bg-[#FFFDF9] rounded-sm border border-[#E8DDD1] text-xs text-[#7A6A5F] space-y-4">
                {product.care_instructions && (
                  <div>
                    <h4 className="font-serif text-sm text-[#2B211C] mb-1">
                      Garment & Embroidery Care
                    </h4>
                    <p className="leading-relaxed font-light">
                      {product.care_instructions}
                    </p>
                  </div>
                )}
                {product.rental_conditions && (
                  <div className="pt-3 border-t border-[#E8DDD1]">
                    <h4 className="font-serif text-sm text-[#2B211C] mb-1">
                      Rental Terms & Fitting
                    </h4>
                    <p className="leading-relaxed font-light">
                      {product.rental_conditions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Booking & Details Column (Right matching Reference 05) */}
          <div className="lg:col-span-5 bg-[#FFFDF9] lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-sm lg:rounded-none border lg:border-0 border-[#E8DDD1]">
            <ProductBookingWidget product={product} />
          </div>
        </div>

        {/* Related Outfits Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#E8DDD1]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
                  Curated For You
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
                  More From This Collection
                </h3>
              </div>
              {product.collection && (
                <Link
                  href={`/collections/${product.collection.slug}`}
                  className="text-xs sm:text-sm font-medium text-[#2B211C] hover:text-[#B06F5E] transition-colors"
                >
                  View Collection &rarr;
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer
        customLogoUrl={settings.brand.logo_url}
        contact={settings.contact}
        social={settings.social}
      />
    </div>
  );
}
