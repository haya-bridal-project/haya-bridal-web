import { HayaLogo } from "@/components/brand/HayaLogo";
import { FooterAccordion } from "@/components/storefront/FooterAccordion";
import type { ContactSettings, SocialSettings } from "@/lib/types";

interface FooterProps {
  customLogoUrl?: string | null;
  contact?: ContactSettings;
  social?: SocialSettings;
}

const collectionLinks = [
  { label: "Bridal Dresses", href: "/dresses", strong: true },
  { label: "Fine Ornaments", href: "/ornaments", strong: true },
  { label: "Heritage Lehengas", href: "/collections/bridal-wear" },
  { label: "Couture Ensembles", href: "/collections/couture" },
  { label: "View All →", href: "/collections" },
];

const experienceLinks = [
  { label: "Customization Guide", href: "/how-it-works" },
  { label: "Client Enquiry", href: "/enquiry" },
  { label: "Fitting & Size Guide", href: "/size-guide" },
  { label: "About Haya", href: "/about" },
  { label: "Contact Studio", href: "/contact" },
];

const policyLinks = [
  { label: "Track My Orders", href: "/account/bookings", strong: true },
  { label: "Cancellation & Refund", href: "/cancellation-refund" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

export function Footer({ customLogoUrl, contact, social }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FAF6F0] border-t border-[#E8DDD1] text-[#2B211C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col pr-0 lg:pr-8 mb-2 lg:mb-0">
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

          {/* Link groups: accordion on mobile, columns on desktop */}
          <div className="lg:contents border-t border-[#E8DDD1] lg:border-0">
            <FooterAccordion title="Categories & Collections" links={collectionLinks} />
            <FooterAccordion title="Experience" links={experienceLinks} />
            <FooterAccordion title="Policies & Orders" links={policyLinks} />
          </div>

        </div>

        {/* Separator and Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#E8DDD1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6A5F]">
          <p>© {currentYear} Haya Bridal Couture &amp; Fine Ornaments. All rights reserved.</p>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>
              Crafted by{" "}
              <a
                href="https://www.ekodrix.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#B06F5E] hover:underline transition-colors"
              >
                Ekodrix
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
