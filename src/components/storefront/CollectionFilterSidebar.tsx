"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { X, Check, SlidersHorizontal, RotateCcw, Gem } from "lucide-react";
import type { Collection } from "@/lib/types";

interface CollectionFilterSidebarProps {
  collections: Collection[];
  activeSlug?: string;
  facets: {
    colors: { name: string; hex: string }[];
    sizes: string[];
    maxPaise: number;
  };
  totalCount: number;
}

export function CollectionFilterSidebar({
  collections,
  activeSlug,
  facets,
  totalCount,
}: CollectionFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Selected filters from query string
  const selectedCategory = searchParams.get("category") || "all";
  const selectedColors = searchParams.getAll("color");
  const selectedSizes = searchParams.getAll("size");
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";

  const updateParam = (key: string, values: string[] | string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset pagination

    if (values === null || (Array.isArray(values) && values.length === 0) || values === "") {
      params.delete(key);
    } else if (Array.isArray(values)) {
      params.delete(key);
      values.forEach((v) => params.append(key, v));
    } else {
      params.set(key, values);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleColor = (colorName: string) => {
    const next = selectedColors.includes(colorName)
      ? selectedColors.filter((c) => c !== colorName)
      : [...selectedColors, colorName];
    updateParam("color", next);
  };

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    updateParam("size", next);
  };

  const clearAllFilters = () => {
    router.push(pathname);
    setMobileDrawerOpen(false);
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "";

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  // Reusable filter controls block
  const filterControls = (
    <div className="flex flex-col space-y-6">
      {/* Product Type Filter: Dresses vs Ornaments */}
      <div>
        <label className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2 font-sans">
          Product Category
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4ECE1]/60 rounded-sm border border-[#E8DDD1] text-[11px]">
          <button
            type="button"
            onClick={() => updateParam("category", null)}
            className={`py-1.5 px-2 rounded-xs font-medium transition-all ${
              selectedCategory === "all" || !searchParams.get("category")
                ? "bg-white text-[#2B211C] shadow-xs"
                : "text-[#7A6A5F] hover:text-[#2B211C]"
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => updateParam("category", "dress")}
            className={`py-1.5 px-2 rounded-xs font-medium transition-all flex items-center justify-center gap-1 ${
              selectedCategory === "dress"
                ? "bg-[#B06F5E] text-white shadow-xs"
                : "text-[#7A6A5F] hover:text-[#2B211C]"
            }`}
          >
            <span>Dresses</span>
          </button>
          <button
            type="button"
            onClick={() => updateParam("category", "ornament")}
            className={`py-1.5 px-2 rounded-xs font-medium transition-all flex items-center justify-center gap-1 ${
              selectedCategory === "ornament"
                ? "bg-[#B06F5E] text-white shadow-xs"
                : "text-[#7A6A5F] hover:text-[#2B211C]"
            }`}
          >
            <Gem className="w-3 h-3" />
            <span>Ornaments</span>
          </button>
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2 font-sans">
          Price Range (₹)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => updateParam("min_price", e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
          />
          <span className="text-xs text-[#7A6A5F]">&ndash;</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => updateParam("max_price", e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
          />
        </div>
      </div>

      {/* Color Swatches */}
      {facets.colors.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-3 font-sans">
            Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const isSelected = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => toggleColor(c.name)}
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? "ring-2 ring-[#B06F5E] ring-offset-2 scale-110 border-transparent"
                      : "border-[#D4C3B2] hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        c.hex.toLowerCase() === "#ffffff" || c.hex.toLowerCase() === "#faf6f0"
                          ? "text-[#2B211C]"
                          : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Pills */}
      {facets.sizes.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2 font-sans">
            Size
          </label>
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((s) => {
              const isSelected = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-3 py-1 text-xs rounded-sm border transition-all ${
                    isSelected
                      ? "bg-[#B06F5E] text-white border-[#B06F5E]"
                      : "bg-white text-[#2B211C] border-[#E8DDD1] hover:border-[#B06F5E]"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. Mobile Filter Header */}
      <div className="lg:hidden w-full mb-6">
        <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-[#E8DDD1]">
          <span className="text-xs text-[#7A6A5F] font-sans">
            Showing <strong className="text-[#2B211C] font-semibold">{totalCount}</strong> styles
          </span>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F0] border border-[#E8DDD1] rounded-sm text-xs text-[#2B211C] font-sans hover:border-[#B06F5E]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#B06F5E]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#B06F5E] text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 pr-8 border-r border-[#E8DDD1]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1] mb-6">
          <h2 className="font-serif text-lg text-[#2B211C] font-normal tracking-wide">
            Filter Catalog
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#B06F5E] hover:underline flex items-center gap-1 font-sans"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Collections Menu */}
        <div className="mb-6 pb-6 border-b border-[#E8DDD1]">
          <label className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2.5 font-sans">
            Collections
          </label>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link
                href="/collections"
                className={`block py-1 transition-colors ${
                  !activeSlug
                    ? "font-semibold text-[#B06F5E]"
                    : "text-[#7A6A5F] hover:text-[#2B211C]"
                }`}
              >
                All Collections
              </Link>
            </li>
            {collections.map((c) => {
              const isActive = activeSlug === c.slug;
              return (
                <li key={c.id}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className={`block py-1 transition-colors ${
                      isActive
                        ? "font-semibold text-[#B06F5E]"
                        : "text-[#7A6A5F] hover:text-[#2B211C]"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {filterControls}
      </aside>

      {/* 3. Mobile Slide-Over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#FAF6F0] p-6 shadow-xl flex flex-col justify-between z-50 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1] mb-6">
                <h3 className="font-serif text-lg text-[#2B211C]">Filter Products</h3>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 text-[#7A6A5F] hover:text-[#2B211C]"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              {filterControls}
            </div>

            <div className="pt-6 border-t border-[#E8DDD1] flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-1/2 py-2.5 text-xs text-[#7A6A5F] hover:text-[#2B211C] border border-[#E8DDD1] rounded-sm bg-white"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className={`py-2.5 text-xs text-white bg-[#B06F5E] rounded-sm font-medium ${
                  hasActiveFilters ? "w-1/2" : "w-full"
                }`}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
