import Link from "next/link";
import { HayaLogo } from "@/components/brand/HayaLogo";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6F0] p-6 text-center">
      <HayaLogo size="lg" variant="dark" />

      <span className="mt-8 text-xs font-sans uppercase tracking-[0.25em] text-[#B06F5E] font-semibold">
        404 — Not Found
      </span>

      <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2B211C] font-normal tracking-tight">
        Outfit or Page Not Found
      </h1>

      <p className="mt-3 text-xs sm:text-sm text-[#7A6A5F] max-w-md font-light leading-relaxed">
        The bridal piece or page you are looking for may have been updated, archived, or is temporarily unavailable in our vault.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm transition-colors shadow-xs"
        >
          Return to Home
        </Link>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] text-xs font-medium tracking-wide uppercase rounded-sm transition-colors"
        >
          <span>Explore Collections</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
