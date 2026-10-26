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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const activeImage = images[selectedIndex] || images[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Mobile swipe gestures
  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
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
    <div className="flex flex-col-reverse lg:flex-row gap-3 sm:gap-4 items-start w-full select-none">
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

      {/* Main Image Showcase (Touch swipeable on mobile) */}
      <div
        className="relative aspect-[3/4] w-full flex-1 rounded-sm overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shadow-xs group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          priority
          className="object-cover object-center transition-all duration-500"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {/* Mobile Slide Counter (e.g., 01 / 04) */}
        {images.length > 1 && (
          <div className="sm:hidden absolute top-3 right-3 bg-black/50 backdrop-blur-xs text-white text-[10px] font-sans px-2 py-0.5 rounded-full tracking-wider z-10">
            {String(selectedIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </div>
        )}

        {/* Mobile / Carousel Nav Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 text-[#2B211C] flex items-center justify-center shadow-xs opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white active:scale-95"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 text-[#2B211C] flex items-center justify-center shadow-xs opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white active:scale-95"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Mobile Pagination Dots */}
            <div className="lg:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
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

      {/* Mobile Horizontal Thumbnail Scroller with Smooth Touch Snap */}
      {images.length > 1 && (
        <div className="flex lg:hidden gap-2.5 overflow-x-auto w-full pb-2 px-0.5 no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-[3/4] w-14 shrink-0 rounded-xs overflow-hidden border transition-all ${
                idx === selectedIndex
                  ? "border-[#B06F5E] ring-1 ring-[#B06F5E]"
                  : "border-[#E8DDD1] opacity-70"
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
