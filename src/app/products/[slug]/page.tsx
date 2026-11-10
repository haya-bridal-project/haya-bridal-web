import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getRelatedProducts,
  getSiteSettings,
} from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductDetailGallery } from "@/components/storefront/ProductDetailGallery";
import { ProductBookingWidget } from "@/components/storefront/ProductBookingWidget";
import { ProductCard } from "@/components/storefront/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_OG_IMAGE, getCanonicalSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = product.seo_title || product.name;
  const description =
    product.seo_description ||
    product.short_description ||
    `Order and customize ${product.name} from Haya Bridal Couture & Fine Ornaments.`;
  const images =
    product.product_images?.length > 0
      ? product.product_images.map((img) => ({
          url: img.url,
          alt: img.alt || product.name,
        }))
      : [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: product.name }];

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: `${title} | Haya Bridal`,
      description,
      url: `/products/${slug}`,
      siteName: "Haya Bridal",
      locale: "en_IN",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Haya Bridal`,
      description,
      images: images.map((img) => img.url),
    },
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

  let initialWishlisted = false;
  if (user) {
    try {
      const supabase = await createClient();
      const { data: w } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();
      initialWishlisted = Boolean(w);
    } catch {
      initialWishlisted = false;
    }
  }

  const siteUrl = getCanonicalSiteUrl();
  const pricePaise = product.price_paise ?? product.rental_price_paise;
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const productImages = product.product_images?.length
    ? product.product_images.map((img) => img.url)
    : [`${siteUrl}${DEFAULT_OG_IMAGE}`];

  const productJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description:
        product.seo_description ||
        product.short_description ||
        `Handcrafted ${product.name} at Haya Bridal Couture & Fine Ornaments.`,
      image: productImages,
      sku: product.slug,
      brand: {
        "@type": "Brand",
        name: "Haya Bridal",
      },
      ...(product.collection?.name ? { category: product.collection.name } : {}),
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "INR",
        price: Number((pricePaise / 100).toFixed(2)),
        availability:
          product.quantity > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        product.collection
          ? {
              "@type": "ListItem",
              position: 2,
              name: product.collection.name,
              item: `${siteUrl}/collections/${product.collection.slug}`,
            }
          : {
              "@type": "ListItem",
              position: 2,
              name: "Collections",
              item: `${siteUrl}/collections`,
            },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <JsonLd data={productJsonLd} />
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Column (Left) - Sticky at viewport height */}
          <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-24 self-start">
            <ProductDetailGallery
              images={product.product_images}
              productName={product.name}
            />
          </div>

          {/* Booking & Details Column (Right) - Scrolls freely */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-8 bg-[#FFFDF9] lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-sm lg:rounded-none border lg:border-0 border-[#E8DDD1]">
            <ProductBookingWidget
              product={product}
              shipping={settings.shipping}
              boutiquePhone={settings.contact?.whatsapp || settings.contact?.phone || "+91 98765 43210"}
              initialWishlisted={initialWishlisted}
            />

            {/* Additional Garment Specifications / Care card */}
            {product.care_instructions && (
              <div className="p-6 bg-[#FFFDF9] rounded-sm border border-[#E8DDD1] text-xs text-[#7A6A5F] space-y-4 shadow-xs">
                <div>
                  <h4 className="font-serif text-sm text-[#2B211C] mb-1">
                    Garment &amp; Embroidery Care
                  </h4>
                  <p className="leading-relaxed font-light">
                    {product.care_instructions}
                  </p>
                </div>
              </div>
            )}
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
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
