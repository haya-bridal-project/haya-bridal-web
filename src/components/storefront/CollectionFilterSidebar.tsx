"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { X, Check, SlidersHorizontal, RotateCcw } from "lucide-react";
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
  const selectedColors = searchParams.getAll("color");
  const selectedSizes = searchParams.getAll("size");
  const selectedSort = searchParams.get("sort") || "latest";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const availableOnly = searchParams.get("available") === "true";

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
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    availableOnly;

  const activeFilterCount =
    selectedColors.length +
    selectedSizes.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (availableOnly ? 1 : 0);

  // Reusable filter controls block for both desktop sidebar and mobile drawer
  const filterControls = (
    <div className="flex flex-col space-y-6">
      {/* Price Range Filter */}
      <div>
        <label className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2 font-sans">
          Rental Price Range
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

      {/* Color Swatches matching Reference 04 */}
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

      {/* Size Pills matching Reference 04 */}
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

      {/* Availability Toggle */}
      <div className="pt-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => updateParam("available", e.target.checked ? "true" : null)}
            className="w-4 h-4 rounded-xs border-[#D4C3B2] text-[#B06F5E] focus:ring-[#B06F5E]"
          />
          <span className="text-xs text-[#2B211C]">Available for Rent</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Filter & Collection Quick Tabs (Visible only on < lg screens) */}
      <div className="lg:hidden w-full mb-6">
        {/* Horizontal Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-3">
          <Link
            href="/collections"
            className={`px-3.5 py-1.5 rounded-full text-xs shrink-0 whitespace-nowrap transition-colors ${
              !activeSlug
                ? "bg-[#B06F5E] text-white font-medium shadow-xs"
                : "bg-white border border-[#E8DDD1] text-[#7A6A5F] hover:text-[#2B211C]"
            }`}
          >
            All Outfits
          </Link>
          {collections.map((col) => {
            const isActive = activeSlug === col.slug;
            return (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className={`px-3.5 py-1.5 rounded-full text-xs shrink-0 whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#B06F5E] text-white font-medium shadow-xs"
                    : "bg-white border border-[#E8DDD1] text-[#7A6A5F] hover:text-[#2B211C]"
                }`}
              >
                {col.name}
              </Link>
            );
          })}
        </div>

        {/* Filter Trigger Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD1]/60">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-white border border-[#E8DDD1] text-xs font-medium text-[#2B211C] shadow-xs active:bg-[#FAF6F0]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#B06F5E]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#B06F5E] text-white text-[10px] font-semibold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#B06F5E] flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* 2. Mobile Filter Slide-over Drawer Modal */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xs bg-[#FAF6F0] h-full shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#B06F5E]" />
                  <h3 className="font-serif text-lg text-[#2B211C]">Filter Outfits</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 text-[#7A6A5F] hover:text-[#2B211C]"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6">
                {filterControls}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8DDD1] flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 py-2.5 px-3 rounded-sm border border-[#E8DDD1] text-xs font-medium text-[#7A6A5F] bg-white text-center"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-sm bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide text-center shadow-xs"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Permanent Sidebar (Visible only on lg screens) */}
      <aside className="hidden lg:flex w-full flex-col space-y-8 pr-0 lg:pr-6">
        {/* Collections Navigation matching Reference 04 */}
        <div>
          <h3 className="font-serif text-lg font-normal tracking-wide text-[#2B211C] mb-4">
            Collections
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href="/collections"
                className={`block py-1 transition-colors ${
                  !activeSlug
                    ? "text-[#B06F5E] font-medium"
                    : "text-[#7A6A5F] hover:text-[#2B211C]"
                }`}
              >
                All Outfits
              </Link>
            </li>
            {collections.map((col) => {
              const isActive = activeSlug === col.slug;
              return (
                <li key={col.id}>
                  <Link
                    href={`/collections/${col.slug}`}
                    className={`block py-1 transition-colors ${
                      isActive
                        ? "text-[#B06F5E] font-medium"
                        : "text-[#7A6A5F] hover:text-[#2B211C]"
                    }`}
                  >
                    {col.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Filter Controls Block */}
        <div className="pt-6 border-t border-[#E8DDD1] flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-normal tracking-wide text-[#2B211C]">
              Filter By
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] text-[#B06F5E] hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {filterControls}
        </div>
      </aside>
    </>
  );
}
