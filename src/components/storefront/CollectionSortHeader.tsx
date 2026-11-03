"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface CollectionSortHeaderProps {
  title: string;
  totalCount: number;
}

export function CollectionSortHeader({
  title,
  totalCount,
}: CollectionSortHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "latest";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-[#E8DDD1] gap-4">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-[#7A6A5F] mt-1 font-sans">
          Showing {totalCount} {totalCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <label htmlFor="sort-select" className="text-xs text-[#7A6A5F] whitespace-nowrap">
          Sort by:
        </label>
        <div className="relative">
          <select
            id="sort-select"
            value={currentSort}
            onChange={handleSortChange}
            className="text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 pr-8 text-[#2B211C] appearance-none focus:outline-none focus:border-[#B06F5E] cursor-pointer"
          >
            <option value="latest">Latest Arrivals</option>
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Product Name (A-Z)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#7A6A5F]">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
