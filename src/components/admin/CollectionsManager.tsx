"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X, Layers } from "lucide-react";
import { CloudinaryUploader, type UploadedAsset } from "@/components/admin/CloudinaryUploader";
import type { Collection } from "@/lib/types";

interface CollectionsManagerProps {
  initialCollections: Collection[];
}

export function CollectionsManager({
  initialCollections = [],
}: CollectionsManagerProps) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [showOnHome, setShowOnHome] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setName("");
    setSlug("");
    setTagline("");
    setDescription("");
    setShowOnHome(true);
    setIsPublished(true);
    setSortOrder(collections.length + 1);
    setAssets([]);
    setErrorMsg(null);
  };

  const startEdit = (col: Collection) => {
    setIsCreating(false);
    setEditingId(col.id);
    setName(col.name);
    setSlug(col.slug);
    setTagline(col.tagline || "");
    setDescription(col.description || "");
    setShowOnHome(col.show_on_home);
    setIsPublished(col.is_published);
    setSortOrder(col.sort_order);
    setAssets(
      col.image_url
        ? [{ url: col.image_url, public_id: col.image_public_id || "", is_primary: true }]
        : []
    );
    setErrorMsg(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (isCreating) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      name,
      slug,
      tagline,
      description,
      show_on_home: showOnHome,
      is_published: isPublished,
      sort_order: sortOrder,
      image_url: assets[0]?.url || null,
      image_public_id: assets[0]?.public_id || null,
    };

    try {
      const endpoint = isCreating
        ? "/api/admin/collections"
        : `/api/admin/collections/${editingId}`;
      const method = isCreating ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save collection.");
      }

      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving collection.");
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this collection?")) return;
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCollections(collections.filter((c) => c.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Categorization
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Collections &amp; Categories
          </h1>
        </div>

        {!isCreating && !editingId && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        )}
      </div>

      {/* Create / Edit Drawer or Card */}
      {(isCreating || editingId) && (
        <form onSubmit={handleSave} className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-sm space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
            <h2 className="font-serif text-xl text-[#2B211C]">
              {isCreating ? "Add New Collection" : `Edit Collection`}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
              className="p-1 text-[#7A6A5F] hover:text-[#2B211C]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-sm">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Collection Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Bridal Wear"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
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
                placeholder="bridal-wear"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Tagline / Eyebrow (e.g. "For your big day")
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
              />
            </div>

            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnHome}
                  onChange={(e) => setShowOnHome(e.target.checked)}
                  className="w-4 h-4 rounded-xs text-[#B06F5E]"
                />
                <span className="font-medium text-[#2B211C]">Show on Homepage (4 Cards)</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded-xs text-[#B06F5E]"
                />
                <span className="font-medium text-[#2B211C]">Published</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Editorial description of outfits in this collection..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2">
              Collection Card / Banner Photo (Cloudinary)
            </label>
            <CloudinaryUploader
              role="collection"
              multiple={false}
              assets={assets}
              onChange={setAssets}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DDD1]">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
              className="px-4 py-2 border border-[#E8DDD1] text-xs font-medium rounded-sm text-[#7A6A5F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium uppercase tracking-wider rounded-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Collection"}
            </button>
          </div>
        </form>
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {collections.map((col) => (
          <div
            key={col.id}
            className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm overflow-hidden flex flex-col justify-between shadow-xs"
          >
            <div className="relative aspect-[4/3] bg-[#F4ECE1]">
              {col.image_url ? (
                <Image
                  src={col.image_url}
                  alt={col.name}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#7A6A5F]">
                  No Image
                </div>
              )}

              {col.show_on_home && (
                <span className="absolute top-2 left-2 bg-[#FAF6F0]/90 px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase text-[#B06F5E] border border-[#E8DDD1]">
                  Homepage Card
                </span>
              )}
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <h3 className="font-serif text-lg text-[#2B211C] font-normal">
                  {col.name}
                </h3>
                {col.tagline && (
                  <p className="text-xs text-[#7A6A5F] mt-0.5 font-light">
                    {col.tagline}
                  </p>
                )}
                <span className="font-mono text-[10px] text-[#7A6A5F] block mt-1">
                  /collections/{col.slug}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8DDD1] flex items-center justify-between text-xs">
                <span
                  className={`px-1.5 py-0.5 rounded-xs text-[10px] font-medium ${
                    col.is_published ? "text-emerald-700 bg-emerald-50" : "text-stone-600 bg-stone-100"
                  }`}
                >
                  {col.is_published ? "Published" : "Draft"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(col)}
                    className="p-1 text-[#7A6A5F] hover:text-[#B06F5E]"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(col.id)}
                    className="p-1 text-[#7A6A5F] hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
