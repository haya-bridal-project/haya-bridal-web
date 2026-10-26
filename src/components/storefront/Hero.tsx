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

  const totalSlides = Math.max(activeSlides.length, 1);
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
    <section className="relative bg-[#FAF6F0] overflow-hidden min-h-[660px] lg:min-h-[720px] flex items-center border-b border-[#E8DDD1]">
      {/* 1. Full-Height Panoramic Background Photo on Right */}
      {currentSlide?.image_url && (
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[62%] h-full z-0 overflow-hidden">
          <Image
            src={currentSlide.image_url}
            alt={currentSlide.image_alt || heading}
            fill
            priority
            className="object-cover object-top lg:object-center transition-opacity duration-700"
            sizes="(max-width: 1024px) 100vw, 65vw"
          />

          {/* Left-to-right seamless blending gradient into #FAF6F0 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0] via-[#FAF6F0]/70 via-35% to-transparent hidden lg:block" />
          
          {/* Mobile vertical gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F0] via-[#FAF6F0]/85 to-transparent lg:hidden" />
        </div>
      )}

      {/* 2. Floating Editorial Quote on the Far Right (Exact Reference 02) */}
      <div className="hidden lg:flex absolute top-14 right-16 z-20 flex-col items-center text-center pointer-events-none">
        <div className="w-[1px] h-8 bg-[#B06F5E] mb-3 relative">
          <div className="w-1.5 h-1.5 rounded-full bg-[#B06F5E] absolute -top-1 -left-[2px]" />
        </div>
        <p className="font-serif italic text-sm text-[#2B211C] leading-snug whitespace-pre-line tracking-wide">
          {sideText}
        </p>
      </div>

      {/* 3. Carousel Navigation at Bottom Right (01 / 03 and 2 Round White Buttons) */}
      <div className="absolute bottom-8 right-6 sm:right-12 lg:right-16 z-20 flex items-center gap-5">
        <span className="text-xs sm:text-sm font-serif text-[#7A6A5F] tracking-widest">
          {slideNumberFormatted} / {totalSlidesFormatted}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeSlides.length <= 1}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-[#2B211C] shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={activeSlides.length <= 1}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-[#2B211C] shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* 4. Left Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 w-full">
        <div className="max-w-xl lg:max-w-xl">
          {/* Eyebrow */}
          <span className="block text-[11px] sm:text-xs font-semibold tracking-[0.28em] text-[#B06F5E] uppercase font-sans mb-3 sm:mb-4">
            {eyebrow}
          </span>

          {/* Main Editorial Heading (Line breaks matching reference: Grace / for Every / Occasion) */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-serif text-[#2B211C] tracking-tight leading-[1.0] font-normal mb-5 sm:mb-6">
            Grace <br />
            for Every <br />
            Occasion
          </h1>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-sm text-[#7A6A5F] max-w-md font-light leading-relaxed font-sans mb-8 sm:mb-10">
            Handcrafted elegance. Curated styles. <br className="hidden sm:inline" />
            Make your special moments unforgettable.
          </p>

          {/* CTA Button */}
          <div className="mb-14 sm:mb-16">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs sm:text-sm font-medium tracking-wide rounded-sm shadow-sm transition-all hover:gap-3.5 group focus:outline-none"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 4 Core Features with Minimalist Outline Icons (Matching Reference 02 Bottom Left) */}
          <div className="flex items-center gap-5 sm:gap-7 pt-4">
            {/* Leading subtle horizontal dash */}
            <span className="w-6 h-[1.5px] bg-[#B06F5E]/60 shrink-0 hidden sm:inline-block" />

            <div className="grid grid-cols-4 gap-4 sm:gap-6 flex-1 max-w-md">
              {/* Feature 1: Premium Collection */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
                <Shield className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
                <span className="text-[10px] sm:text-[11px] font-medium text-[#2B211C] leading-tight">
                  Premium Collection
                </span>
              </div>

              {/* Feature 2: Personal Styling */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
                <Scissors className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
                <span className="text-[10px] sm:text-[11px] font-medium text-[#2B211C] leading-tight">
                  Personal Styling
                </span>
              </div>

              {/* Feature 3: Affordable Rental */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
                <Tag className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
                <span className="text-[10px] sm:text-[11px] font-medium text-[#2B211C] leading-tight">
                  Affordable Rental
                </span>
              </div>

              {/* Feature 4: Hassle Free Process */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2B211C] stroke-[1.4]" />
                <span className="text-[10px] sm:text-[11px] font-medium text-[#2B211C] leading-tight">
                  Hassle Free Process
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
