"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CloudinaryUploader,
  type UploadedAsset,
} from "@/components/admin/CloudinaryUploader";
import { paiseToRupeesInput } from "@/lib/money";
import { AlertCircle, CheckCircle2, Trash2, Plus, ArrowLeft } from "lucide-react";

interface ProductFormProps {
  initialProduct?: any;
  collections: { id: string; name: string }[];
}

export function ProductForm({
  initialProduct,
  collections = [],
}: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialProduct?.id;

  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [collectionId, setCollectionId] = useState(
    initialProduct?.collection_id || ""
  );
  const [rentalPriceRupees, setRentalPriceRupees] = useState(
    initialProduct ? paiseToRupeesInput(initialProduct.rental_price_paise) : "12000"
  );
  const [rentalDurationDays, setRentalDurationDays] = useState(
    initialProduct?.rental_duration_days || 3
  );
  const [depositRupees, setDepositRupees] = useState(
    initialProduct ? paiseToRupeesInput(initialProduct.deposit_paise) : "5000"
  );
  const [shortDesc, setShortDesc] = useState(
    initialProduct?.short_description || ""
  );
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );

  // Sizes selection
  const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialProduct?.sizes || ["S", "M", "L"]
  );

  // Colors list
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(
    initialProduct?.colors || [{ name: "Ivory", hex: "#F3E9DA" }]
  );
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#B06F5E");

  // Additional duration options
  const [rentalOptions, setRentalOptions] = useState<
    { duration_days: number; price_rupees: string }[]
  >(
    initialProduct?.product_rental_options?.map((o: any) => ({
      duration_days: o.duration_days,
      price_rupees: paiseToRupeesInput(o.price_paise),
    })) || [
      { duration_days: 5, price_rupees: "16000" },
      { duration_days: 7, price_rupees: "20000" },
    ]
  );

  // Images state
  const [images, setImages] = useState<UploadedAsset[]>(
    initialProduct?.product_images?.map((img: any) => ({
      url: img.url,
      public_id: img.public_id,
      alt: img.alt,
      color_name: img.color_name,
      is_primary: img.is_primary,
      width: img.width,
      height: img.height,
    })) || []
  );

  // Status & SEO
  const [isPublished, setIsPublished] = useState(
    initialProduct ? initialProduct.is_published : true
  );
  const [isFeatured, setIsFeatured] = useState(
    initialProduct ? initialProduct.is_featured : false
  );
  const [careInstructions, setCareInstructions] = useState(
    initialProduct?.care_instructions ||
      "Professional dry clean only. Protect intricate zardozi embroidery from direct perfume spray."
  );
  const [rentalConditions, setRentalConditions] = useState(
    initialProduct?.rental_conditions ||
      "Includes complimentary alteration fitting with our master tailor. Return in provided luxury garment case."
  );
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(
    initialProduct?.seo_description || ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-slug generator on name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const toggleSize = (sz: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const addColor = () => {
    if (!newColorName.trim()) return;
    setColors([...colors, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName("");
  };

  const removeColor = (idx: number) => {
    setColors(colors.filter((_, i) => i !== idx));
  };

  const addOption = () => {
    setRentalOptions([
      ...rentalOptions,
      { duration_days: 10, price_rupees: "25000" },
    ]);
  };

  const removeOption = (idx: number) => {
    setRentalOptions(rentalOptions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const payload = {
      name,
      slug,
      collection_id: collectionId || null,
      rental_price_rupees: rentalPriceRupees,
      rental_duration_days: rentalDurationDays,
      deposit_rupees: depositRupees,
      short_description: shortDesc,
      description,
      sizes: selectedSizes,
      colors,
      rental_options: rentalOptions,
      images,
      is_published: isPublished,
      is_featured: isFeatured,
      care_instructions: careInstructions,
      rental_conditions: rentalConditions,
      seo_title: seoTitle,
      seo_description: seoDescription,
    };

    try {
      const endpoint = isEditing
        ? `/api/admin/products/${initialProduct.id}`
        : "/api/admin/products";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    if (!confirm("Are you sure you want to archive this bridal outfit?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${initialProduct.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg("Failed to delete product.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-1.5 rounded-xs border border-[#E8DDD1] text-[#7A6A5F] hover:text-[#2B211C] hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-serif text-2xl text-[#2B211C] font-normal">
            {isEditing ? `Edit: ${initialProduct.name}` : "Create New Bridal Outfit"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium rounded-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium uppercase tracking-wider rounded-sm shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : isEditing ? "Update Garment" : "Publish to Vault"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Basic Details Card */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-lg text-[#2B211C] pb-2 border-b border-[#E8DDD1]">
          General Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Outfit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Ivory Embroidered Bridal Lehenga"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ivory-embroidered-bridal-lehenga"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Assigned Collection
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            >
              <option value="">-- No Collection --</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Rental Rate (₹) *
            </label>
            <input
              type="number"
              required
              min={0}
              value={rentalPriceRupees}
              onChange={(e) => setRentalPriceRupees(e.target.value)}
              placeholder="12000"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Base Duration (Days) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={rentalDurationDays}
              onChange={(e) => setRentalDurationDays(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Refundable Security Deposit (₹)
            </label>
            <input
              type="number"
              min={0}
              value={depositRupees}
              onChange={(e) => setDepositRupees(e.target.value)}
              placeholder="5000"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div className="flex items-center gap-6 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded-xs text-[#B06F5E] focus:ring-[#B06F5E]"
              />
              <span className="font-medium text-[#2B211C]">Published on Website</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded-xs text-[#B06F5E] focus:ring-[#B06F5E]"
              />
              <span className="font-medium text-[#2B211C]">Feature on Homepage</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
            Short Description (Display on Card / Header)
          </label>
          <input
            type="text"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            placeholder="A timeless ivory lehenga with delicate hand embroidery, perfect for your special day."
            className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
            Full Editorial Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the fabric weave (pure raw silk, organza), embroidery technique (dabka, cutdana, sequins), cancan flare, and styling notes..."
            className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
          />
        </div>
      </div>

      {/* 2. Cloudinary Upload Card */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-serif text-lg text-[#2B211C]">
            Product Imagery (Cloudinary CDN)
          </h2>
          <p className="text-xs text-[#7A6A5F]">
            Upload multiple high-resolution photos. Select one as primary showcase. All images are hosted securely on Cloudinary.
          </p>
        </div>

        <CloudinaryUploader
          role="product"
          multiple={true}
          assets={images}
          onChange={setImages}
          colors={colors}
        />
      </div>

      {/* 3. Sizes & Color Options */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-5">
        <h2 className="font-serif text-lg text-[#2B211C] pb-2 border-b border-[#E8DDD1]">
          Sizing &amp; Color Variants
        </h2>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2 font-sans">
            Available Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((sz) => {
              const checked = selectedSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`px-3.5 py-1.5 rounded-sm text-xs font-medium border transition-colors ${
                    checked
                      ? "bg-[#B06F5E] text-white border-[#B06F5E]"
                      : "bg-white text-[#2B211C] border-[#E8DDD1] hover:border-[#B06F5E]"
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E8DDD1]">
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2 font-sans">
            Color Swatches
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {colors.map((c, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF6F0] border border-[#E8DDD1] rounded-sm text-xs"
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/10"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.name}</span>
                <button
                  type="button"
                  onClick={() => removeColor(idx)}
                  className="text-[#7A6A5F] hover:text-red-600 ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Color name (e.g. Sage Green)"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] flex-1"
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-8 h-8 rounded-sm border border-[#E8DDD1] p-0.5 cursor-pointer bg-white"
            />
            <button
              type="button"
              onClick={addColor}
              className="px-3 py-1.5 bg-[#FAF6F0] border border-[#E8DDD1] hover:bg-[#F4ECE1] text-xs font-medium rounded-sm"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* 4. Duration Pricing Rules */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD1]">
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Extended Rental Durations
            </h2>
            <p className="text-xs text-[#7A6A5F]">
              Configure custom rental prices for 5-day, 7-day, or 10-day reservations.
            </p>
          </div>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1 text-xs text-[#B06F5E] hover:underline font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Duration Tier</span>
          </button>
        </div>

        <div className="space-y-3">
          {rentalOptions.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A6A5F]">Days:</span>
                <input
                  type="number"
                  min={1}
                  value={opt.duration_days}
                  onChange={(e) => {
                    const next = [...rentalOptions];
                    next[idx].duration_days = parseInt(e.target.value, 10);
                    setRentalOptions(next);
                  }}
                  className="w-20 px-2 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A6A5F]">Price (₹):</span>
                <input
                  type="number"
                  min={0}
                  value={opt.price_rupees}
                  onChange={(e) => {
                    const next = [...rentalOptions];
                    next[idx].price_rupees = e.target.value;
                    setRentalOptions(next);
                  }}
                  className="w-28 px-2 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Remove tier"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Care Instructions & Terms */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-lg text-[#2B211C] pb-2 border-b border-[#E8DDD1]">
          Care Instructions &amp; Conditions
        </h2>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
            Care Instructions
          </label>
          <textarea
            rows={2}
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
            Rental Conditions
          </label>
          <textarea
            rows={2}
            value={rentalConditions}
            onChange={(e) => setRentalConditions(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
          />
        </div>
      </div>
    </form>
  );
}
