import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getProductBySlug,
  getSiteSettings,
} from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";
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

  const user = await getCurrentUser();
  if (!user) {
    const nextUrl = `/book/${slug}?${new URLSearchParams(
      searchParams as Record<string, string>
    ).toString()}`;
    redirect(`/login?next=${encodeURIComponent(nextUrl)}`);
  }

  const settings = await getSiteSettings();

  const duration = typeof searchParams.duration === "string"
    ? parseInt(searchParams.duration, 10)
    : product.rental_duration_days;
  const initialSize = typeof searchParams.size === "string" ? searchParams.size : product.sizes[0] || "";
  const initialColor = typeof searchParams.color === "string" ? searchParams.color : product.colors[0]?.name || "";
  const initialStart = typeof searchParams.start === "string" ? searchParams.start : "";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user.email}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-8 font-sans">
          <Link href="/" className="hover:text-[#2B211C]">Home</Link>
          <span>/</span>
          <Link href={`/products/${product.slug}`} className="hover:text-[#2B211C]">{product.name}</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Reserve & Book</span>
        </nav>

        <div className="mb-8">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Rental Reservation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight mt-1">
            Reserve Your Bridal Outfit
          </h1>
        </div>

        <BookingCheckoutForm
          product={product}
          user={user}
          settings={settings}
          initialDuration={duration}
          initialSize={initialSize}
          initialColor={initialColor}
          initialStart={initialStart}
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
