import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getProductBySlug,
  getSiteSettings,
} from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
import { getCustomerPrefill } from "@/lib/customer";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { BookingCheckoutForm } from "@/components/storefront/BookingCheckoutForm";

export const dynamic = "force-dynamic";

interface BookPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookOutfitPage(props: BookPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Guests and logged-in customers can both check out. Logged-in
  // customers get their saved name, phone and address prefilled.
  const user = await getCurrentUser();
  const prefill = getCustomerPrefill(user);

  const settings = await getSiteSettings();

  const initialSize = typeof searchParams.size === "string" ? searchParams.size : product.sizes[0] || "Standard";
  const initialColor = typeof searchParams.color === "string" ? searchParams.color : product.colors[0]?.name || "";
  const isCustom = searchParams.is_custom === "true";
  const bust = typeof searchParams.bust === "string" ? searchParams.bust : "";
  const waist = typeof searchParams.waist === "string" ? searchParams.waist : "";
  const hips = typeof searchParams.hips === "string" ? searchParams.hips : "";
  const shoulder = typeof searchParams.shoulder === "string" ? searchParams.shoulder : "";
  const length = typeof searchParams.length === "string" ? searchParams.length : "";
  const customNotes = typeof searchParams.custom_notes === "string" ? searchParams.custom_notes : "";

  const isOrnament = product.category === "ornament" || product.category === "ornaments";
  if (!isOrnament) {
    redirect(`/products/${product.slug}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user?.email}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-8 font-sans">
          <Link href="/" className="hover:text-[#2B211C]">Home</Link>
          <span>/</span>
          <Link href={`/products/${product.slug}`} className="hover:text-[#2B211C]">{product.name}</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Checkout</span>
        </nav>

        <div className="mb-8">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            {isOrnament ? "Artisan Ornament Purchase" : "Bridal Dress Order & Customization"}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
            Complete Your Order
          </h1>
          {!user && (
            <p className="mt-2 text-xs text-[#7A6A5F] font-sans">
              Checking out as a guest.{" "}
              <Link
                href={`/login?next=${encodeURIComponent(`/book/${product.slug}`)}`}
                className="text-[#B06F5E] hover:underline font-medium"
              >
                Sign in
              </Link>{" "}
              to use your saved address.
            </p>
          )}
        </div>

        <BookingCheckoutForm
          product={product}
          prefill={prefill}
          settings={settings}
          initialDuration={1}
          initialSize={initialSize}
          initialColor={initialColor}
          initialStart={new Date().toISOString().split("T")[0]}
          initialIsCustom={isCustom}
          initialBust={bust}
          initialWaist={waist}
          initialHips={hips}
          initialShoulder={shoulder}
          initialLength={length}
          initialCustomNotes={customNotes}
        />
      </main>

      <Footer
        customLogoUrl={settings.brand.logo_url}
        contact={settings.contact}
        social={settings.social}
      />
    </div>
  );
}
