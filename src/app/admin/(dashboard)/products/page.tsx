import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit3, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

interface AdminProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminProductsPage(props: AdminProductsPageProps) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*,product_images(*),collection:collections(id,name)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  const { data: products } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Vault Inventory
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Bridal &amp; Couture Garments
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Outfit</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="flex items-center max-w-md bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 shadow-xs">
        <Search className="w-4 h-4 text-[#7A6A5F] mr-2" />
        <form className="w-full">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by outfit name, code, or silhouette..."
            className="w-full text-xs text-[#2B211C] focus:outline-none"
          />
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm shadow-xs overflow-hidden">
        {products && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-[#7A6A5F] uppercase tracking-wider font-sans border-b border-[#E8DDD1]">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">Collection</th>
                  <th className="py-3 px-4">Rental Rate</th>
                  <th className="py-3 px-4">Deposit</th>
                  <th className="py-3 px-4">Sizes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD1] text-[#2B211C]">
                {products.map((p: any) => {
                  const primaryImg =
                    p.product_images?.find((img: any) => img.is_primary) ||
                    p.product_images?.[0];

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="relative aspect-[3/4] w-12 rounded-xs overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shrink-0">
                          {primaryImg?.url ? (
                            <Image
                              src={primaryImg.url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-[#7A6A5F]">
                              Haya
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-serif text-sm font-medium hover:text-[#B06F5E] transition-colors block"
                          >
                            {p.name}
                          </Link>
                          <span className="font-mono text-[10px] text-[#7A6A5F]">
                            /{p.slug}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#7A6A5F]">
                        {p.collection?.name || "Unassigned"}
                      </td>

                      <td className="py-3 px-4 font-sans font-medium">
                        {formatINR(p.rental_price_paise)} / {p.rental_duration_days}D
                      </td>

                      <td className="py-3 px-4 font-sans text-[#7A6A5F]">
                        {formatINR(p.deposit_paise)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-[#7A6A5F]">
                          {p.sizes?.join(", ") || "Free Size"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider ${
                            p.is_published
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-stone-100 text-stone-700 border border-stone-200"
                          }`}
                        >
                          {p.is_published ? "Published" : "Draft"}
                        </span>
                        {p.is_featured && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-xs bg-[#FAF6F0] text-[#B06F5E] text-[10px] border border-[#E8DDD1]">
                            Featured
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1 text-[#B06F5E] hover:underline font-medium"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#7A6A5F] space-y-3">
            <p>No outfits found in the bridal vault inventory.</p>
            <Link
              href="/admin/products/new"
              className="inline-flex px-4 py-2 bg-[#B06F5E] text-white rounded-sm text-xs font-medium"
            >
              Add First Bridal Garment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
