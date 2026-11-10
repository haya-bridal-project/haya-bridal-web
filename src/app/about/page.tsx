import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "About Haya Bridal Couture",
  description:
    "Discover the story behind Haya Bridal Couture — crafting handcrafted bridal lehengas, bespoke custom-tailored dresses, and fine heritage bridal ornaments.",
  path: "/about",
});

export default async function AboutPage() {
  return (
    <PolicyPageLayout
      slug="about"
      defaultTitle="About Haya Bridal Couture"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p className="text-base font-serif text-[#2B211C] leading-relaxed">
            Haya was conceived to celebrate bespoke bridal luxury — crafting magnificent handcrafted bridal couture and fine heritage ornaments for your most cherished celebrations.
          </p>
          <p>
            Bridal couture represents the pinnacle of Indian artisanal artistry: authentic zardozi embroidery, dabka needlework, pure silk jacquards, and meticulous hand-beading requiring hundreds of hours of master craftsmanship.
          </p>
          <p>
            Haya creates bespoke, made-to-order bridal lehengas, gowns, and hand-selected bridal jewelry sets. Each creation is tailored to your exact body silhouette and delivered in luxury bespoke packaging.
          </p>
          <div className="pt-4 border-t border-[#E8DDD1]">
            <h3 className="font-serif text-lg text-[#2B211C] mb-2 font-medium">
              Our Pillars of Excellence
            </h3>
            <ul className="space-y-2 list-disc list-inside text-[#7A6A5F]">
              <li>Authentic artisanal couture with pure fabrics and hand-embroidery.</li>
              <li>Bespoke custom tailoring and personal master stylist guidance.</li>
              <li>Heritage bridal ornaments with 22K micro-plating and certified authenticity.</li>
              <li>Direct, transparent pricing with dedicated concierge order tracking.</li>
            </ul>
          </div>
        </div>
      }
    />
  );
}
