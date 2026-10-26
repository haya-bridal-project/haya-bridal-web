import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Collection } from "@/lib/types";

interface CollectionCardsProps {
  collections: Collection[];
}

export function CollectionCards({ collections = [] }: CollectionCardsProps) {
  // If no collections are in database yet, show clean empty state as per rule
  if (collections.length === 0) {
    return null;
  }

  // Display collections flagged for homepage or the top 4
  const displayCollections = collections
    .filter((c) => c.show_on_home)
    .slice(0, 4);

  if (displayCollections.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-14 bg-[#FAF6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile View: Story pills matching Reference 03 */}
        <div className="flex sm:hidden items-center justify-between gap-3 overflow-x-auto pb-4 no-scrollbar">
          {displayCollections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="flex flex-col items-center shrink-0 w-20 group"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#D4C3B2] p-0.5 bg-[#FFFDF9] group-hover:border-[#B06F5E] transition-all">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-[#F4ECE1]">
                  {col.image_url ? (
                    <Image
                      src={col.image_url}
                      alt={col.image_alt || col.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-serif text-[#7A6A5F]">
                      {col.name.slice(0, 2)}
                    </div>
                  )}
                </div>
              </div>
              <span className="mt-2 text-[11px] font-medium text-[#2B211C] text-center line-clamp-1 group-hover:text-[#B06F5E]">
                {col.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop View: 4 Featured Collection Cards matching Reference 02 */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayCollections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="group relative aspect-[4/3] rounded-sm overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-end p-5"
            >
              {/* Background Image with Dark Vignette for Text Legibility */}
              {col.image_url ? (
                <>
                  <Image
                    src={col.image_url}
                    alt={col.image_alt || col.name}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent transition-opacity duration-300" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4ECE1] to-[#E8DDD1]" />
              )}

              {/* Card Content & Circular Arrow Target */}
              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <h3
                    className={`font-serif text-lg lg:text-xl font-normal tracking-tight ${
                      col.image_url ? "text-[#FFFDF9]" : "text-[#2B211C]"
                    }`}
                  >
                    {col.name}
                  </h3>
                  {col.tagline && (
                    <p
                      className={`text-xs font-sans tracking-wide mt-0.5 line-clamp-1 ${
                        col.image_url ? "text-[#FFFDF9]/80" : "text-[#7A6A5F]"
                      }`}
                    >
                      {col.tagline}
                    </p>
                  )}
                </div>

                {/* Circular hover action button matching reference */}
                <div className="w-8 h-8 rounded-full bg-white/90 group-hover:bg-[#B06F5E] group-hover:text-white text-[#2B211C] flex items-center justify-center shrink-0 ml-3 transition-colors duration-300 shadow-xs">
                  <ArrowUpRight className="w-4 h-4 stroke-[2]" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
