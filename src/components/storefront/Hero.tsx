"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Scissors,
  Tag,
  ShieldCheck,
  ArrowRight,
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
  const sideText = currentSlide?.side_text ?? "The Art of Dressing Your Moments";

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
    <section className="relative bg-[#FAF6F0] overflow-hidden border-b border-[#E8DDD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-5 h-[1px] bg-[#B06F5E]" />
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#B06F5E] uppercase font-sans">
                {eyebrow}
              </span>
            </div>

            {/* Main Editorial Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2B211C] tracking-tight leading-[1.1] mb-5 font-normal">
              {heading}
            </h1>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base text-[#7A6A5F] max-w-lg leading-relaxed font-sans font-light mb-8">
              {body}
            </p>

            {/* CTA Button */}
            <div className="mb-10 sm:mb-12">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs sm:text-sm font-medium tracking-wide rounded-sm shadow-sm transition-all hover:gap-4 group focus:outline-none"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Supporting 4 Service Highlights beneath the main message */}
            <div className="pt-6 border-t border-[#E8DDD1] grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#F4ECE1] flex items-center justify-center shrink-0 text-[#B06F5E]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-[#2B211C] font-medium leading-tight">
                  Premium Collection
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#F4ECE1] flex items-center justify-center shrink-0 text-[#B06F5E]">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-[#2B211C] font-medium leading-tight">
                  Personal Styling
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#F4ECE1] flex items-center justify-center shrink-0 text-[#B06F5E]">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-[#2B211C] font-medium leading-tight">
                  Affordable Rental
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#F4ECE1] flex items-center justify-center shrink-0 text-[#B06F5E]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-[#2B211C] font-medium leading-tight">
                  Hassle Free Process
                </span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Block with Side Text & Restrained Carousel Controls */}
          <div className="lg:col-span-6 relative order-1 lg:order-2">
            <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] w-full rounded-sm overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shadow-sm">
              {currentSlide?.image_url ? (
                <Image
                  src={currentSlide.image_url}
                  alt={currentSlide.image_alt || heading}
                  fill
                  priority
                  className="object-cover object-center transition-all duration-700"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                /* Intentional neutral luxury cream fallback matching reference layout */
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4ECE1] via-[#FAF6F0] to-[#E8DDD1] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full border border-[#D4C3B2] flex items-center justify-center mb-4 text-[#B06F5E]/70">
                    <Sparkles className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#2B211C] mb-2 font-normal">
                    Curated Bridal Elegance
                  </h3>
                  <p className="text-xs text-[#7A6A5F] max-w-xs font-sans">
                    Discover handcrafted designer lehengas, sarees, and couture gowns for your unforgettable celebration.
                  </p>
                </div>
              )}

              {/* Floating side editorial phrase: "The Art of Dressing Your Moments" */}
              <div className="hidden sm:flex absolute top-8 right-6 items-center gap-3 bg-[#FAF6F0]/85 backdrop-blur-sm py-2 px-3.5 rounded-sm border border-[#E8DDD1]/80 shadow-xs">
                <span className="w-[1.5px] h-6 bg-[#B06F5E]" />
                <span className="text-[11px] font-serif text-[#2B211C] tracking-wide leading-tight">
                  {sideText}
                </span>
              </div>

              {/* Carousel indicator controls on bottom right matching reference: # 01 / 03 */}
              <div className="absolute bottom-5 right-5 flex items-center gap-3 bg-[#FAF6F0]/90 backdrop-blur-sm px-4 py-2 rounded-sm border border-[#E8DDD1] shadow-xs">
                <span className="text-[11px] font-sans font-medium text-[#7A6A5F] tracking-wider">
                  # {slideNumberFormatted} / {totalSlidesFormatted}
                </span>
                <div className="flex items-center gap-1 border-l border-[#E8DDD1] pl-2 ml-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={activeSlides.length <= 1}
                    className="p-1 rounded text-[#2B211C] hover:text-[#B06F5E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={activeSlides.length <= 1}
                    className="p-1 rounded text-[#2B211C] hover:text-[#B06F5E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
