"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImage } from "@/lib/types";

interface ProductDetailGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductDetailGallery({
  images,
  productName,
}: ProductDetailGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeImage = images[selectedIndex] || images[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full rounded-sm bg-[#F4ECE1] border border-[#E8DDD1] flex flex-col items-center justify-center p-8 text-center text-[#7A6A5F]">
        <span className="font-serif text-2xl text-[#2B211C] mb-2">{productName}</span>
        <span className="text-xs tracking-wider uppercase">Bridal Couture</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 items-start w-full">
      {/* Desktop Vertical Thumbnail Stack (Left column matching Reference 05) */}
      {images.length > 1 && (
        <div className="hidden lg:flex flex-col gap-3 w-20 shrink-0 max-h-[640px] overflow-y-auto no-scrollbar">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-[3/4] w-full rounded-xs overflow-hidden bg-[#F4ECE1] border transition-all ${
                  isSelected
                    ? "border-[#B06F5E] ring-1 ring-[#B06F5E] opacity-100"
                    : "border-[#E8DDD1] opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${productName} view ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Showcase (Center matching Reference 05 & 06) */}
      <div className="relative aspect-[3/4] w-full flex-1 rounded-sm overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shadow-xs group">
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          priority
          className="object-cover object-center transition-all duration-500"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {/* Mobile / Carousel Nav Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 text-[#2B211C] flex items-center justify-center shadow-xs opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 text-[#2B211C] flex items-center justify-center shadow-xs opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Mobile Pagination Dots */}
            <div className="lg:hidden absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === selectedIndex ? "w-5 bg-[#B06F5E]" : "w-1.5 bg-white/70"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile Horizontal Thumbnail Scroller */}
      {images.length > 1 && (
        <div className="flex lg:hidden gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-[3/4] w-14 shrink-0 rounded-xs overflow-hidden border ${
                idx === selectedIndex ? "border-[#B06F5E]" : "border-[#E8DDD1] opacity-70"
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
