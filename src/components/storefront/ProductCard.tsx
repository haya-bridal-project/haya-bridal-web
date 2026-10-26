"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/types";

interface ProductCardProps {
  product: ProductWithImages;
  initialWishlisted?: boolean;
  onWishlistToggle?: (productId: string, isWishlisted: boolean) => void;
}

export function ProductCard({
  product,
  initialWishlisted = false,
  onWishlistToggle,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isToggling, setIsToggling] = useState(false);

  // Get primary image or first available image
  const primaryImage =
    product.product_images.find((img) => img.is_primary) ||
    product.product_images[0];

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    const nextState = !wishlisted;
    setWishlisted(nextState);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, action: nextState ? "add" : "remove" }),
      });
      if (!res.ok && res.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      onWishlistToggle?.(product.id, nextState);
    } catch {
      setWishlisted(!nextState); // Rollback on error
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="group flex flex-col bg-[#FFFDF9] rounded-sm overflow-hidden border border-[#E8DDD1] shadow-xs hover:shadow-md transition-all duration-300">
      {/* Image Container (3:4 ratio) */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4ECE1] block"
      >
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#7A6A5F] bg-[#F4ECE1]">
            <span className="font-serif text-lg text-[#2B211C]">{product.name}</span>
            <span className="text-[11px] uppercase tracking-wider text-[#7A6A5F] mt-1">Bridal Couture</span>
          </div>
        )}

        {/* Wishlist Button top right */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#2B211C] hover:text-[#B06F5E] shadow-xs transition-colors z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wishlisted ? "fill-[#B06F5E] text-[#B06F5E]" : "stroke-[1.6]"
            }`}
          />
        </button>

        {/* Featured Tag */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 bg-[#FAF6F0]/90 backdrop-blur-xs px-2.5 py-0.5 rounded-sm border border-[#E8DDD1] text-[10px] font-sans font-medium uppercase tracking-wider text-[#2B211C]">
            Featured
          </div>
        )}
      </Link>

      {/* Product Details Block */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Subtitle / Collection Tag */}
          <p className="text-[11px] font-sans text-[#7A6A5F] tracking-wide uppercase mb-1">
            {product.collection?.name || "Bridal Rental"}
          </p>

          {/* Product Name */}
          <Link
            href={`/products/${product.slug}`}
            className="font-serif text-base text-[#2B211C] font-normal tracking-tight line-clamp-1 hover:text-[#B06F5E] transition-colors"
          >
            {product.name}
          </Link>

          {/* Price & Duration */}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-[#2B211C] font-sans">
              {formatINR(product.rental_price_paise)}
            </span>
            <span className="text-xs text-[#7A6A5F] font-sans">
              / {product.rental_duration_days} Days
            </span>
          </div>
        </div>

        {/* View Details Action Button matching Reference 04 */}
        <div className="mt-4 pt-3 border-t border-[#E8DDD1]/60">
          <Link
            href={`/products/${product.slug}`}
            className="w-full inline-flex items-center justify-center py-2 px-4 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide rounded-sm transition-colors text-center shadow-xs"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
