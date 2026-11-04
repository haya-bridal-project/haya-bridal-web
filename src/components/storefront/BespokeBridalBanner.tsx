"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BespokeBridalBannerProps {
  imageSrc?: string;
  ctaHref?: string;
}

const DEFAULT_BESPOKE_IMAGE = "/images/bespoke-bridal.jpg";

export function BespokeBridalBanner({
  imageSrc = DEFAULT_BESPOKE_IMAGE,
  ctaHref = "/dresses",
}: BespokeBridalBannerProps) {
  return (
    <section className="py-6 sm:py-8 bg-[#FAF6F0] border-t border-[#E8DDD1]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#FAF5EE] border border-[#E8DDD1] rounded-xs sm:rounded-sm overflow-hidden shadow-2xs grid grid-cols-1 md:grid-cols-12 items-stretch">
          
          {/* Left Column: Bridal Image */}
          <div className="md:col-span-5 lg:col-span-5 relative min-h-[200px] sm:min-h-[250px] md:min-h-[270px] lg:min-h-[290px] w-full bg-[#F4ECE1]">
            <Image
              src={imageSrc}
              alt="Bespoke bridal dress fitting and couture craftsmanship"
              fill
              className="object-cover object-[center_25%]"
              sizes="(max-width: 768px) 100vw, 42vw"
              priority
            />
            {/* Soft inner blend gradient */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-[#FAF5EE]/20 pointer-events-none" />
          </div>

          {/* Right Column: Sleek & Compact Content */}
          <div className="md:col-span-7 lg:col-span-7 relative px-5 py-5 sm:px-8 sm:py-6 lg:px-9 lg:py-6 flex flex-col justify-center items-center text-center bg-[#FAF5EE]">
            
            {/* Top Right Subtle Botanical Line Art */}
            <div
              className="absolute top-0 right-0 pointer-events-none w-28 sm:w-40 h-28 sm:h-40 opacity-40 text-[#D8C4B2]"
              aria-hidden="true"
            >
              <svg viewBox="0 0 200 200" fill="none" className="w-full h-full stroke-current stroke-[1.2]">
                <path d="M200,20 C170,25 150,55 155,85 C160,115 190,120 200,125" />
                <path d="M190,0 C160,10 135,35 140,70 C145,105 180,120 200,140" />
                <path d="M140,70 C120,60 110,40 120,20 C130,5 155,0 170,0" />
                <path d="M140,70 C120,85 105,110 115,130 C125,150 155,145 175,130" />
                <path d="M155,85 C145,95 135,95 130,85" strokeDasharray="2 3" />
                <path d="M140,70 C150,55 160,50 170,55" strokeDasharray="2 3" />
                <circle cx="155" cy="85" r="2.5" fill="currentColor" fillOpacity="0.25" />
              </svg>
            </div>

            {/* Tagline with horizontal lines */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <span className="h-px w-5 sm:w-8 bg-[#B06F5E]/40" />
              <span className="text-[9px] sm:text-[10px] font-sans font-semibold uppercase tracking-[0.22em] text-[#B06F5E]">
                The Art of Bespoke Bridal
              </span>
              <span className="h-px w-5 sm:w-8 bg-[#B06F5E]/40" />
            </div>

            {/* Main Headline */}
            <h2 className="font-serif text-lg sm:text-xl lg:text-2xl text-[#2B211C] font-normal tracking-tight leading-snug mb-1.5">
              Your Dream Dress, Thoughtfully Crafted.
            </h2>

            {/* Sub-paragraph */}
            <p className="text-[11px] sm:text-xs text-[#6C5B51] max-w-lg leading-relaxed font-light mb-3.5 sm:mb-4">
              From your first inspiration to the final stitch, every detail is thoughtfully personalized to create a bridal outfit that reflects your unique style.
            </p>

            {/* 3 Step Icons & Descriptions in a Row (Compact) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg mb-3.5 sm:mb-4 relative">
              
              {/* Pillar 1 */}
              <div className="flex flex-col items-center text-center px-1 relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#D8C4B2] bg-[#FFFDF9] flex items-center justify-center text-[#B06F5E] mb-1.5 shadow-2xs">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  >
                    <path d="M9 3h6v2H9z" />
                    <path d="M12 2v3" />
                    <path d="M9 5c-1.5 2-2 4-2 7 0 2 .5 3 2 4.5V21h6v-4.5c1.5-1.5 2-2.5 2-4.5 0-3-.5-5-2-7H9z" />
                    <path d="M8 9h8" />
                    <path d="M9 13h6" />
                  </svg>
                </div>
                <h4 className="text-[10px] sm:text-[11px] font-serif font-medium text-[#2B211C] leading-tight">
                  Personalized
                  <br />
                  <span className="font-sans text-[9px] sm:text-[10px] text-[#7A6A5F] font-normal">
                    Design Consultation
                  </span>
                </h4>
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-6 w-px bg-[#E8DDD1]" />
              </div>

              {/* Pillar 2 */}
              <div className="flex flex-col items-center text-center px-1 relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#D8C4B2] bg-[#FFFDF9] flex items-center justify-center text-[#B06F5E] mb-1.5 shadow-2xs">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  >
                    <path d="M6 3h12l4 6-10 12L2 9z" />
                    <path d="M2 9h20" />
                    <path d="M10 3l-2 6 4 12 4-12-2-6" />
                  </svg>
                </div>
                <h4 className="text-[10px] sm:text-[11px] font-serif font-medium text-[#2B211C] leading-tight">
                  Custom Measurements
                  <br />
                  <span className="font-sans text-[9px] sm:text-[10px] text-[#7A6A5F] font-normal">
                    &amp; Tailoring
                  </span>
                </h4>
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-6 w-px bg-[#E8DDD1]" />
              </div>

              {/* Pillar 3 */}
              <div className="flex flex-col items-center text-center px-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#D8C4B2] bg-[#FFFDF9] flex items-center justify-center text-[#B06F5E] mb-1.5 shadow-2xs">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  >
                    <path d="M4.5 19.5L19 5" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L19 8l-3-3 2.5-2.5z" />
                    <circle cx="18.5" cy="5.5" r="0.75" fill="currentColor" />
                    <path d="M5 21c-1.5 0-2.5-1-2.5-2.5 0-2 2-3 4-3s4-1 4-2.5" />
                  </svg>
                </div>
                <h4 className="text-[10px] sm:text-[11px] font-serif font-medium text-[#2B211C] leading-tight">
                  Handcrafted Embroidery
                  <br />
                  <span className="font-sans text-[9px] sm:text-[10px] text-[#7A6A5F] font-normal">
                    &amp; Finishing
                  </span>
                </h4>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-2 sm:py-2.5 bg-[#A45D4C] hover:bg-[#8E4D3D] text-white text-[11px] sm:text-xs font-medium tracking-wide rounded-xs shadow-2xs transition-all group"
            >
              <span>Dresses</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
}
