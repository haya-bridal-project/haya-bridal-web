import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <PolicyPageLayout
      slug="about"
      defaultTitle="About Haya Premium Bridal"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p className="text-base font-serif text-[#2B211C] leading-relaxed">
            Haya was conceived to redefine bridal luxury — making the world’s most magnificent handcrafted ensembles accessible for every celebration without compromise.
          </p>
          <p>
            Bridal couture represents the pinnacle of Indian artisanal artistry: zardozi embroidery, dabka needlework, silk jacquards, and meticulous hand-beading that require hundreds of hours to craft. Yet, most wedding outfits are worn only once before remaining locked away in a closet.
          </p>
          <p>
            Haya curates an exclusive vault of premier bridal and couture wear for rent. Each piece is preserved with archival care, tailored to your exact body measurements, and delivered in pristine condition.
          </p>
          <div className="pt-4 border-t border-[#E8DDD1]">
            <h3 className="font-serif text-lg text-[#2B211C] mb-2 font-medium">
              Our Pillars of Excellence
            </h3>
            <ul className="space-y-2 list-disc list-inside text-[#7A6A5F]">
              <li>Handcrafted artisanal couture with zero synthetic compromise.</li>
              <li>Bespoke fitting and personal styling sessions for every bride.</li>
              <li>Strict multi-stage sanitation and fabric preservation.</li>
              <li>Transparent rental pricing and guaranteed date reservation.</li>
            </ul>
          </div>
        </div>
      }
    />
  );
}
