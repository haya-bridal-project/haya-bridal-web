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
          Showing {totalCount} {totalCount === 1 ? "outfit" : "outfits"}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <label htmlFor="sort-select" className="text-xs text-[#7A6A5F] whitespace-nowrap">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={handleSortChange}
          className="text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-1.5 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
        >
          <option value="latest">Latest</option>
          <option value="featured">Featured First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name">Alphabetical</option>
        </select>
      </div>
    </div>
  );
}
