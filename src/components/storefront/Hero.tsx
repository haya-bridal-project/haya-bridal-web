"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Shield,
  Scissors,
  Tag,
  CheckCircle2,
} from "lucide-react";
import type { HeroSlide } from "@/lib/types";

interface HeroProps {
  slides?: HeroSlide[];
}

export function Hero({ slides = [] }: HeroProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const activeSlides = slides.length > 0 ? slides : [];
  const currentSlide = activeSlides[currentSlideIndex];

  // Default editorial copy matching the approved reference
  const eyebrow = currentSlide?.eyebrow ?? "PREMIUM BRIDAL RENTAL";
  const heading = currentSlide?.heading ?? "Grace for Every Occasion";
  const body =
    currentSlide?.body ??
    "Handcrafted elegance. Curated styles. Make your special moments unforgettable.";
  const ctaLabel = currentSlide?.cta_label ?? "Explore Collections";
  const ctaHref = currentSlide?.cta_href ?? "/collections";
  const sideText = currentSlide?.side_text ?? "The Art\nof Dressing\nYour\nMoments";
  const imageSrc = currentSlide?.image_url || "/hero-bride.png";

  const totalSlides = Math.max(activeSlides.length, 3);
  const slideNumberFormatted = String(currentSlideIndex + 1).padStart(2, "0");
  const totalSlidesFormatted = String(totalSlides).padStart(2, "0");

  const handlePrev = () => {
    if (activeSlides.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (activeSlides.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="relative w-full bg-[#FAF6F0] overflow-hidden min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] xl:min-h-[740px] flex flex-col justify-between border-b border-[#E8DDD1]">
      {/* 1. Full Panoramic Background Photo (Exact 2034x773 Master Photograph) */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={currentSlide?.image_alt || heading}
          fill
          priority
          className="object-cover object-[72%_center] sm:object-[65%_center] md:object-center transition-all duration-700"
          sizes="100vw"
        />
        {/* Subtle left gradient overlay only on small mobile screens to keep text legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0]/90 via-[#FAF6F0]/60 to-transparent sm:hidden" />
      </div>

      {/* 2. Floating Editorial Quote on the Right Side of Bride */}
      <div className="hidden lg:flex absolute top-14 right-20 xl:right-28 z-20 flex-col items-center text-center pointer-events-none select-none">
        <div className="w-[1px] h-8 bg-[#8C7769] mb-3 relative">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8C7769] absolute -top-1 -left-[2px]" />
        </div>
        <p className="font-serif italic text-xs sm:text-sm text-[#2B211C] leading-snug whitespace-pre-line tracking-wide">
          {sideText}
        </p>
      </div>

      {/* 3. Carousel Controls at Bottom Right (01 / 03 + 2 Separate Round White Buttons) */}
      <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-10 lg:right-16 z-20 flex items-center gap-3 sm:gap-4 select-none">
        <span className="text-xs sm:text-sm font-serif text-[#7A6A5F] tracking-widest">
          {slideNumberFormatted} / {totalSlidesFormatted}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-[#2B211C] shadow-sm hover:shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-[#2B211C] shadow-sm hover:shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* 4. Left Content Area Over the Sunlit Wall of the Photograph */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full flex-1 flex flex-col justify-between py-12 sm:py-16 lg:py-20">
        {/* Main Text Content */}
        <div className="max-w-md lg:max-w-lg my-auto">
          {/* Eyebrow */}
          <span className="block text-[11px] sm:text-xs font-semibold tracking-[0.24em] text-[#7A6A5F] uppercase font-sans mb-3 sm:mb-4">
            {eyebrow}
          </span>

          {/* Editorial Three-Line Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[76px] font-serif text-[#2B211C] tracking-tight leading-[0.98] font-normal mb-4 sm:mb-5">
            Grace <br />
            for Every <br />
            Occasion
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#5A4C42] max-w-sm sm:max-w-md font-light leading-relaxed font-sans mb-6 sm:mb-8">
            Handcrafted elegance. Curated styles. <br className="hidden sm:inline" />
            Make your special moments unforgettable.
          </p>

          {/* Terracotta Button */}
          <div>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs sm:text-sm font-medium tracking-wide rounded-sm shadow-sm transition-all hover:gap-3.5 group focus:outline-none"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* 5. Bottom Highlights: Horizontal Line + 4 Minimalist Stacked Features */}
        <div className="flex items-center gap-5 sm:gap-7 pt-6 sm:pt-10">
          {/* Leading subtle horizontal dash matching reference */}
          <span className="w-7 h-[1.5px] bg-[#2B211C]/40 shrink-0 hidden sm:inline-block" />

          <div className="flex items-center gap-6 sm:gap-8 lg:gap-10 overflow-x-auto pb-1 max-w-xl">
            {/* 1. Premium Collection */}
            <div className="flex flex-col items-center text-center gap-1.5 shrink-0">
              <Shield className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[10px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight whitespace-nowrap">
                Premium Collection
              </span>
            </div>

            {/* 2. Personal Styling */}
            <div className="flex flex-col items-center text-center gap-1.5 shrink-0">
              <Scissors className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[10px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight whitespace-nowrap">
                Personal Styling
              </span>
            </div>

            {/* 3. Affordable Rental */}
            <div className="flex flex-col items-center text-center gap-1.5 shrink-0">
              <Tag className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[10px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight whitespace-nowrap">
                Affordable Rental
              </span>
            </div>

            {/* 4. Hassle Free Process */}
            <div className="flex flex-col items-center text-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[10px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight whitespace-nowrap">
                Hassle Free Process
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
