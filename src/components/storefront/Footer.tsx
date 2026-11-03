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
              Haya is an exclusive luxury boutique specializing in handcrafted bridal dresses, couture lehengas, and heritage fine ornaments. Curated bespoke elegance delivered with complimentary tailor-made fittings.
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
              Categories &amp; Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-[#7A6A5F]">
              <li>
                <Link href="/collections?category=dress" className="hover:text-[#B06F5E] transition-colors font-medium text-[#2B211C]">
                  Bridal Dresses
                </Link>
              </li>
              <li>
                <Link href="/collections?category=ornament" className="hover:text-[#B06F5E] transition-colors font-medium text-[#2B211C]">
                  Fine Ornaments
                </Link>
              </li>
              <li>
                <Link href="/collections/bridal-wear" className="hover:text-[#B06F5E] transition-colors">
                  Heritage Lehengas
                </Link>
              </li>
              <li>
                <Link href="/collections/couture" className="hover:text-[#B06F5E] transition-colors">
                  Couture Ensembles
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-[#B06F5E] transition-colors">
                  View All &rarr;
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
                  Customization Guide
                </Link>
              </li>
              <li>
                <Link href="/enquiry" className="hover:text-[#B06F5E] transition-colors">
                  Client Enquiry
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-[#B06F5E] transition-colors">
                  Fitting &amp; Size Guide
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#B06F5E] transition-colors">
                  About Haya
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#B06F5E] transition-colors">
                  Contact Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies Column */}
          <div>
            <h4 className="font-serif text-base font-normal tracking-wide text-[#2B211C] mb-4">
              Policies &amp; Orders
            </h4>
            <ul className="space-y-2.5 text-xs text-[#7A6A5F]">
              <li>
                <Link href="/account/bookings" className="hover:text-[#B06F5E] transition-colors font-medium text-[#2B211C]">
                  Track My Orders
                </Link>
              </li>
              <li>
                <Link href="/cancellation-refund" className="hover:text-[#B06F5E] transition-colors">
                  Cancellation &amp; Refund
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#B06F5E] transition-colors">
                  Terms &amp; Conditions
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
          <p>© {currentYear} Haya Bridal Couture &amp; Fine Ornaments. All rights reserved.</p>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>100% Prepaid Online Orders (No COD)</span>
            <span>Insured Delivery Across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
