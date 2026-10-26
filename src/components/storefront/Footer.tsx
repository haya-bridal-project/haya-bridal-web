import Link from "next/link";
import { HayaLogo } from "@/components/brand/HayaLogo";
import type { ContactSettings, SocialSettings } from "@/lib/types";

interface FooterProps {
  customLogoUrl?: string | null;
  contact?: ContactSettings;
  social?: SocialSettings;
}

export function Footer({ customLogoUrl, contact, social }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FAF6F0] border-t border-[#E8DDD1] text-[#2B211C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col pr-0 lg:pr-8">
            <HayaLogo size="md" variant="dark" customLogoUrl={customLogoUrl} />
            <p className="mt-4 text-xs sm:text-sm text-[#7A6A5F] font-light leading-relaxed max-w-sm">
              Haya is an exclusive premium bridal rental destination offering handcrafted lehengas, couture ensembles, and occasion wear. Experience the luxury of designer elegance curated for your most cherished celebrations.
            </p>
            {contact?.phone && (
              <p className="mt-4 text-xs text-[#2B211C] font-medium font-sans">
                Studio: <span className="font-normal text-[#7A6A5F]">{contact.phone}</span>
              </p>
            )}
            {contact?.email && (
              <p className="mt-1 text-xs text-[#2B211C] font-medium font-sans">
                Email: <span className="font-normal text-[#7A6A5F]">{contact.email}</span>
              </p>
            )}
          </div>

          {/* Collections Column */}
          <div>
            <h4 className="font-serif text-base font-normal tracking-wide text-[#2B211C] mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-[#7A6A5F]">
              <li>
                <Link href="/collections/bridal-wear" className="hover:text-[#B06F5E] transition-colors">
                  Bridal Wear
                </Link>
              </li>
              <li>
                <Link href="/collections/couture" className="hover:text-[#B06F5E] transition-colors">
                  Couture Collection
                </Link>
              </li>
              <li>
                <Link href="/collections/pret-collection" className="hover:text-[#B06F5E] transition-colors">
                  Pret Collection
                </Link>
              </li>
              <li>
                <Link href="/collections/kids-wear" className="hover:text-[#B06F5E] transition-colors">
                  Kids Wear
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-[#B06F5E] transition-colors font-medium text-[#2B211C]">
                  View All Collections &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Experience Column */}
          <div>
            <h4 className="font-serif text-base font-normal tracking-wide text-[#2B211C] mb-4">
              Experience
            </h4>
            <ul className="space-y-2.5 text-xs text-[#7A6A5F]">
              <li>
                <Link href="/how-it-works" className="hover:text-[#B06F5E] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/consultation" className="hover:text-[#B06F5E] transition-colors">
                  Book Consultation
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-[#B06F5E] transition-colors">
                  Fitting & Size Guide
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#B06F5E] transition-colors">
                  About Haya
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#B06F5E] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies Column */}
          <div>
            <h4 className="font-serif text-base font-normal tracking-wide text-[#2B211C] mb-4">
              Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-[#7A6A5F]">
              <li>
                <Link href="/rental-policy" className="hover:text-[#B06F5E] transition-colors">
                  Rental Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-refund" className="hover:text-[#B06F5E] transition-colors">
                  Cancellation & Refund
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#B06F5E] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-[#B06F5E] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-[#B06F5E] hover:underline transition-colors">
                  Staff / Admin
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Separator and Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#E8DDD1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6A5F]">
          <p>© {currentYear} Haya Premium Bridal Rental. All rights reserved.</p>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>Curated Bridal Wear & Haute Couture</span>
            <span>Handcrafted in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
