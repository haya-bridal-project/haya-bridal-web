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
  Award,
  CreditCard,
} from "lucide-react";
import type { HeroSlide } from "@/lib/types";

interface HeroProps {
  slides?: HeroSlide[];
}

export function Hero({ slides = [] }: HeroProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const activeSlides = slides.length > 0 ? slides : [];
  const currentSlide = activeSlides[currentSlideIndex];

  // Default editorial copy
  const eyebrow = currentSlide?.eyebrow ?? "BESPOKE BRIDAL COUTURE & FINE ORNAMENTS";
  const heading = currentSlide?.heading ?? "Grace for Every Occasion";
  const body =
    currentSlide?.body ??
    "Handcrafted bridal dresses tailored to your measurements and curated fine ornaments.";
  const ctaLabel = currentSlide?.cta_label ?? "Explore Collections";
  const ctaHref = currentSlide?.cta_href ?? "/collections";
  const sideText = currentSlide?.side_text ?? "The Art\nof Dressing\nYour\nMoments";
  const imageSrc = currentSlide?.image_url || "/hero-bride.png";

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

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const activeImgSrc = failedImages[imageSrc] ? "/hero-bride.png" : imageSrc;

  return (
    <section className="relative w-full bg-[#FAF6F0] overflow-hidden min-h-[560px] sm:min-h-[640px] lg:min-h-[700px] xl:min-h-[740px] flex flex-col justify-between border-b border-[#E8DDD1]">
      {/* 1. Full Panoramic Background Photo (Without smoky overlay / blur) */}
      <div className="absolute inset-0 z-0">
        <Image
          src={activeImgSrc}
          alt={currentSlide?.image_alt || heading}
          fill
          priority
          onError={() => setFailedImages((prev) => ({ ...prev, [imageSrc]: true }))}
          className="object-cover object-[center_28%] sm:object-center transition-all duration-700"
          sizes="100vw"
        />
      </div>

      {/* Desktop/Tablet Slide Navigation Controls */}
      {activeSlides.length > 1 && (
        <div className="hidden sm:flex absolute bottom-8 right-6 sm:right-10 lg:right-16 z-30 items-center gap-3 select-none">
          <span className="text-xs sm:text-sm font-serif text-[#7A6A5F] tracking-widest">
            {slideNumberFormatted} / {totalSlidesFormatted}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#2B211C] shadow-sm hover:shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#2B211C] shadow-sm hover:shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Top-Right Calligraphy Side Text */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex justify-end">
        <p className="font-serif italic text-xs sm:text-sm lg:text-base text-[#7A6A5F] tracking-widest uppercase text-right leading-relaxed hidden sm:block whitespace-pre-line opacity-80">
          {sideText}
        </p>
      </div>

      {/* 3. Main Hero Editorial Typography & Content Block */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 flex-1 flex flex-col justify-between">
        <div className="max-w-xl lg:max-w-2xl my-auto pt-8 sm:pt-12">
          {/* Eyebrow */}
          <span className="inline-block text-[10px] sm:text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E] mb-3 sm:mb-4">
            {eyebrow}
          </span>

          {/* Heading */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#2B211C] font-normal tracking-tight leading-[1.1] mb-3 sm:mb-4">
            {heading}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#5A4C42] max-w-xs sm:max-w-md font-light leading-relaxed font-sans mb-5 sm:mb-8 whitespace-pre-line">
            {body}
          </p>

          {/* CTA & Mobile Carousel Controls Row */}
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs sm:text-sm font-medium tracking-wide rounded-sm shadow-sm transition-all hover:gap-3 group focus:outline-none"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Mobile-only Slide Navigation */}
            <div className="flex sm:hidden items-center gap-2">
              <span className="text-[11px] font-serif text-[#7A6A5F] tracking-wider mr-1">
                {slideNumberFormatted} / {totalSlidesFormatted}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-white/95 text-[#2B211C] shadow-xs flex items-center justify-center active:scale-95"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-white/95 text-[#2B211C] shadow-xs flex items-center justify-center active:scale-95"
                aria-label="Next slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Bottom Highlights: Stacked Features */}
        <div className="flex items-center gap-3 sm:gap-7 pt-6 sm:pt-10 border-t border-[#E8DDD1]/40 sm:border-0 mt-6 sm:mt-0">
          <span className="w-7 h-[1.5px] bg-[#2B211C]/40 shrink-0 hidden sm:inline-block" />

          <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 sm:gap-8 lg:gap-10 w-full sm:w-auto max-w-xl">
            {/* 1. Bridal Dresses & Ornaments */}
            <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[9px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight">
                Dresses &amp; Ornaments
              </span>
            </div>

            {/* 2. Custom Tailoring */}
            <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5">
              <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[9px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight">
                Custom Tailoring
              </span>
            </div>

            {/* 3. Online Payments */}
            <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[9px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight">
                Online Checkout
              </span>
            </div>

            {/* 4. Handcrafted Luxury */}
            <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2B211C] stroke-[1.4]" />
              <span className="text-[9px] sm:text-[11px] font-sans font-medium text-[#2B211C] leading-tight">
                Handcrafted Luxury
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
