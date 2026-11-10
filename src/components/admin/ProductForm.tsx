"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CloudinaryUploader,
  type UploadedAsset,
} from "@/components/admin/CloudinaryUploader";
import { paiseToRupeesInput } from "@/lib/money";
import { ConfirmDialogModal } from "@/components/admin/ConfirmDialogModal";
import { AlertCircle, CheckCircle2, Trash2, Plus, ArrowLeft, Scissors, Gem } from "lucide-react";
import type { ProductWithImages } from "@/lib/types";

interface ProductFormProps {
  initialProduct?: ProductWithImages | null;
  collections: { id: string; name: string }[];
}

export function ProductForm({
  initialProduct,
  collections = [],
}: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialProduct?.id;

  const [category, setCategory] = useState<"dress" | "ornament">(
    initialProduct?.category === "ornament" || initialProduct?.category === "ornaments"
      ? "ornament"
      : "dress"
  );
  const [allowCustomization, setAllowCustomization] = useState(
    initialProduct ? initialProduct.allow_customization !== false : true
  );

  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [collectionId, setCollectionId] = useState(
    initialProduct?.collection_id || ""
  );
  const [priceRupees, setPriceRupees] = useState(
    initialProduct
      ? paiseToRupeesInput(initialProduct.price_paise ?? initialProduct.rental_price_paise)
      : "15000"
  );
  const [compareAtPriceRupees, setCompareAtPriceRupees] = useState(
    initialProduct?.compare_at_price_paise
      ? paiseToRupeesInput(initialProduct.compare_at_price_paise)
      : ""
  );
  const [shortDesc, setShortDesc] = useState(
    initialProduct?.short_description || ""
  );
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );

  // Sizes selection
  const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "Custom Fit"];
  const ORNAMENT_SIZES = ["Free Size", "Standard", "Adjustable"];

  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialProduct && initialProduct.sizes && initialProduct.sizes.length > 0
      ? initialProduct.sizes
      : category === "dress"
      ? ["S", "M", "L", "Custom Fit"]
      : ["Free Size"]
  );

  // Colors list
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(
    initialProduct?.colors || [{ name: "Ivory", hex: "#F3E9DA" }]
  );
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#B06F5E");

  // Images state
  const [images, setImages] = useState<UploadedAsset[]>(
    initialProduct?.product_images?.map((img) => ({
      url: img.url,
      public_id: img.public_id,
      alt: img.alt ?? undefined,
      color_name: img.color_name ?? undefined,
      is_primary: img.is_primary,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
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
      (category === "ornament"
        ? "Keep stored in luxury velvet jewelry case. Avoid contact with moisture, perfume, and cosmetics."
        : "Professional dry clean only. Protect intricate zardozi and hand embroidery from direct perfume spray.")
  );
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(
    initialProduct?.seo_description || ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete / Archive Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const payload = {
      name,
      slug,
      category,
      allow_customization: category === "dress" ? allowCustomization : false,
      collection_id: collectionId || null,
      price_rupees: priceRupees,
      rental_price_rupees: priceRupees,
      compare_at_price_rupees: compareAtPriceRupees || null,
      short_description: shortDesc,
      description,
      sizes: selectedSizes,
      colors,
      images,
      is_published: isPublished,
      is_featured: isFeatured,
      care_instructions: careInstructions,
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

  const handleConfirmDelete = async () => {
    if (!isEditing) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${initialProduct.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg("Failed to delete product.");
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
        {/* Top Bar Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E8DDD1] gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="p-1.5 text-[#7A6A5F] hover:text-[#2B211C] hover:bg-[#FAF6F0] rounded-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
                {isEditing ? "Edit Catalog Item" : "Create New Product"}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#2B211C] font-normal tracking-tight mt-0.5">
                {isEditing ? `Edit: ${name}` : "Add Dress or Ornament"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-sm text-xs font-medium transition-colors"
              >
                Archive Product
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-sm text-xs font-medium tracking-wide uppercase transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Publish Product"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Category Selection: Dress vs Ornaments */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B211C] font-normal pb-2 border-b border-[#E8DDD1]">
            1. Product Type &amp; Classification
          </h2>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2 font-medium">
              Select Product Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setCategory("dress");
                  setSelectedSizes(["S", "M", "L", "Custom Fit"]);
                }}
                className={`p-4 rounded-sm border text-left transition-all flex items-start gap-3 ${
                  category === "dress"
                    ? "border-[#B06F5E] bg-[#FAF6F0] ring-1 ring-[#B06F5E]"
                    : "border-[#E8DDD1] bg-white hover:border-[#B06F5E]/50"
                }`}
              >
                <div className="p-2 rounded-xs bg-[#B06F5E]/10 text-[#B06F5E] shrink-0 mt-0.5">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-serif text-base font-medium text-[#2B211C] block">
                    Bridal Dress / Garment
                  </span>
                  <span className="text-xs text-[#7A6A5F] mt-0.5 block">
                    Bridal Lehengas, Reception Gowns, Sarees, and Couture ensembles. Supports custom fit measurements.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory("ornament");
                  setSelectedSizes(["Free Size"]);
                }}
                className={`p-4 rounded-sm border text-left transition-all flex items-start gap-3 ${
                  category === "ornament"
                    ? "border-[#B06F5E] bg-[#FAF6F0] ring-1 ring-[#B06F5E]"
                    : "border-[#E8DDD1] bg-white hover:border-[#B06F5E]/50"
                }`}
              >
                <div className="p-2 rounded-xs bg-[#B06F5E]/10 text-[#B06F5E] shrink-0 mt-0.5">
                  <Gem className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-serif text-base font-medium text-[#2B211C] block">
                    Fine Ornament / Jewelry
                  </span>
                  <span className="text-xs text-[#7A6A5F] mt-0.5 block">
                    Bridal Jewelry sets, Necklaces, Chokers, Bangles, and Ornaments. No body measurements needed.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Dress Customization Toggle */}
          {category === "dress" && (
            <div className="p-3 bg-[#FAF6F0]/60 border border-[#E8DDD1] rounded-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#2B211C] block">
                  Allow Dress Customization &amp; Measurements
                </span>
                <span className="text-[11px] text-[#7A6A5F]">
                  Enables customers to provide Bust, Waist, Hips, and special tailoring notes during checkout.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowCustomization}
                onChange={(e) => setAllowCustomization(e.target.checked)}
                className="w-4 h-4 accent-[#B06F5E] cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* 2. Core Identity & Pricing */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B211C] font-normal pb-2 border-b border-[#E8DDD1]">
            2. Basic Details &amp; Razorpay Purchase Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Royal Ivory Zardozi Lehenga"
                className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="royal-ivory-zardozi-lehenga"
                className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] font-mono focus:outline-none focus:border-[#B06F5E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Boutique Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              >
                <option value="">None (Unassigned)</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-medium text-[#2B211C]">
                Purchase Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-[#7A6A5F]">₹</span>
                <input
                  type="text"
                  required
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  placeholder="15000"
                  className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm pl-7 pr-3 py-2 text-[#2B211C] font-semibold focus:outline-none focus:border-[#B06F5E]"
                />
              </div>
              <span className="text-[10px] text-[#7A6A5F] mt-0.5 block">Prepaid via Razorpay</span>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Original MRP / Compare At (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-[#7A6A5F]">₹</span>
                <input
                  type="text"
                  value={compareAtPriceRupees}
                  onChange={(e) => setCompareAtPriceRupees(e.target.value)}
                  placeholder="20000"
                  className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm pl-7 pr-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />
              </div>
              <span className="text-[10px] text-[#7A6A5F] mt-0.5 block">Optional strikethrough</span>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Short Tagline / Summary
            </label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Handcrafted raw silk lehenga with heritage zardozi borders..."
              className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Complete Description &amp; Craftsmanship Notes
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed fabric composition, craftsmanship heritage, embellishments..."
              className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm p-3 text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>
        </div>

        {/* 3. Sizes & Colors */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B211C] font-normal pb-2 border-b border-[#E8DDD1]">
            3. Available Sizing &amp; Colors
          </h2>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2 font-medium">
              Available Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {(category === "dress" ? DRESS_SIZES : ORNAMENT_SIZES).map((sz) => {
                const active = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1.5 rounded-sm border text-xs font-medium transition-all ${
                      active
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

          {/* Colors Palette */}
          <div className="pt-2">
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2 font-medium">
              Color Variations
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {colors.map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E8DDD1] rounded-sm text-xs text-[#2B211C]"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="ml-1 text-[#7A6A5F] hover:text-red-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color name (e.g. Ruby Red, Polki Gold)"
                className="text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-1.5 text-[#2B211C] flex-1 focus:outline-none"
              />
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-8 h-8 rounded-sm border border-[#E8DDD1] cursor-pointer"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#F4ECE1] text-[#2B211C] border border-[#E8DDD1] rounded-sm text-xs font-medium"
              >
                Add Color
              </button>
            </div>
          </div>
        </div>

        {/* 4. High-Resolution Product Images */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B211C] font-normal pb-2 border-b border-[#E8DDD1]">
            4. Product Imagery (Cloudinary)
          </h2>

          <CloudinaryUploader
            assets={images}
            onChange={setImages}
            role="product"
            multiple={true}
            colors={colors}
          />
        </div>

        {/* 5. Care Instructions & Settings */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B211C] font-normal pb-2 border-b border-[#E8DDD1]">
            5. Care Guide, Status &amp; SEO
          </h2>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Care &amp; Handling Instructions
            </label>
            <textarea
              rows={2}
              value={careInstructions}
              onChange={(e) => setCareInstructions(e.target.value)}
              className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm p-2.5 text-[#2B211C] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 p-3 bg-[#FAF6F0] rounded-sm border border-[#E8DDD1] cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-[#B06F5E]"
              />
              <div>
                <span className="font-medium text-[#2B211C] block">Publish to Storefront</span>
                <span className="text-[10px] text-[#7A6A5F]">Make visible for customer purchase</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 bg-[#FAF6F0] rounded-sm border border-[#E8DDD1] cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#B06F5E]"
              />
              <div>
                <span className="font-medium text-[#2B211C] block">Feature on Homepage</span>
                <span className="text-[10px] text-[#7A6A5F]">Show in curated spotlight showcase</span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                SEO Page Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="e.g. Royal Ivory Zardozi Lehenga | Haya Bridal"
                className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Meta Description
              </label>
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Exclusive handcrafted bridal lehenga with intricate hand embroidery..."
                className="w-full text-xs bg-white border border-[#E8DDD1] rounded-sm px-3 py-2 text-[#2B211C]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DDD1]">
          <Link
            href="/admin/products"
            className="px-4 py-2 border border-[#E8DDD1] hover:bg-[#FAF6F0] text-xs font-medium text-[#2B211C] rounded-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white rounded-sm text-xs font-medium uppercase tracking-wider shadow-xs disabled:opacity-50"
          >
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Publish Product"}
          </button>
        </div>
      </form>

      {/* Archive / Delete Product Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Archive Catalog Product"
        message={`Are you sure you want to archive "${name}"? Archiving will unpublish and hide this item from the active store catalog.`}
        confirmLabel="Yes, Archive Product"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
