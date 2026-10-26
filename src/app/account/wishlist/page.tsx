import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/public";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { ProductWithImages } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomerWishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/wishlist");

  const supabase = await createClient();
  const settings = await getSiteSettings();

  // Fetch wishlisted products
  const { data } = await supabase
    .from("wishlist_items")
    .select("product:products(*,product_images(*),collection:collections(id,name,slug))")
    .eq("user_id", user.id);

  const wishlistedProducts = (data || [])
    .map((item: any) => item.product)
    .filter(Boolean) as ProductWithImages[];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user.email}
        wishlistCount={wishlistedProducts.length}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/account" className="hover:text-[#2B211C]">My Account</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Saved Wishlist</span>
        </nav>

        <div className="mb-8 pb-4 border-b border-[#E8DDD1]">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Curated Selection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
            Your Saved Bridal Outfits
          </h1>
          <p className="text-xs text-[#7A6A5F] mt-1 font-sans">
            {wishlistedProducts.length} {wishlistedProducts.length === 1 ? "outfit" : "outfits"} saved
          </p>
        </div>

        {wishlistedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistedProducts.map((p) => (
              <ProductCard key={p.id} product={p} initialWishlisted={true} />
            ))}
          </div>
        ) : (
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-12 text-center shadow-xs max-w-md mx-auto">
            <h3 className="font-serif text-xl text-[#2B211C] mb-2 font-normal">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-[#7A6A5F] mb-6 leading-relaxed">
              Explore our bridal wear and couture collections to save your favorite lehengas and gowns for your wedding festivities.
            </p>
            <Link
              href="/collections"
              className="inline-flex px-5 py-2.5 bg-[#B06F5E] text-white text-xs font-medium rounded-sm uppercase tracking-wider"
            >
              Browse Collections
            </Link>
          </div>
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
