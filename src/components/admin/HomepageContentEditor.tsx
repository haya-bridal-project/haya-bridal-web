"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { CloudinaryUploader, type UploadedAsset } from "@/components/admin/CloudinaryUploader";
import type { HeroSlide, SiteSettings } from "@/lib/types";

interface HomepageContentEditorProps {
  initialSlides: HeroSlide[];
  initialSettings: SiteSettings;
}

export function HomepageContentEditor({
  initialSlides = [],
  initialSettings,
}: HomepageContentEditorProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);

  // Active slide editor
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [slideAssets, setSlideAssets] = useState<UploadedAsset[]>([]);


  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const startCreateSlide = () => {
    setEditingSlide({
      eyebrow: "PREMIUM BRIDAL RENTAL",
      heading: "Grace for Every Occasion",
      body: "Handcrafted elegance. Curated styles. Make your special moments unforgettable.",
      cta_label: "Explore Collections",
      cta_href: "/collections",
      side_text: "The Art of Dressing Your Moments",
      is_published: true,
      sort_order: slides.length + 1,
    });
    setSlideAssets([]);
  };

  const startEditSlide = (s: HeroSlide) => {
    setEditingSlide(s);
    setSlideAssets(
      s.image_url ? [{ url: s.image_url, public_id: s.image_public_id || "" }] : []
    );
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide?.heading) return;
    setSaving(true);

    const payload = {
      action: "save_slide",
      slide: {
        ...editingSlide,
        image_url: slideAssets[0]?.url || null,
        image_public_id: slideAssets[0]?.public_id || null,
      },
    };

    try {
      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) window.location.reload();
    } catch {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm("Are you sure you want to delete this hero slide?")) return;
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_slide", slideId }),
      });
      if (res.ok) {
        setSlides(slides.filter((s) => s.id !== slideId));
      }
    } catch {}
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_settings",
          settings: {
            brand: settings.brand,
            home: settings.home,
            contact: settings.contact,
          },
        }),
      });

      if (res.ok) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Storefront Presentation
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Homepage &amp; Hero Carousel Management
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium uppercase tracking-wider rounded-sm shadow-xs transition-colors"
        >
          {saving ? "Saving..." : "Save All Homepage Settings"}
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Homepage configuration updated successfully!</span>
        </div>
      )}



      {/* 2. Hero Slides Management */}
      <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Hero Carousel Slides
            </h2>
            <p className="text-xs text-[#7A6A5F]">
              Match the approved bridal editorial hero reference layout.
            </p>
          </div>

          {!editingSlide && (
            <button
              type="button"
              onClick={startCreateSlide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F0] border border-[#E8DDD1] hover:border-[#B06F5E] text-xs font-medium rounded-sm text-[#2B211C]"
            >
              <Plus className="w-3.5 h-3.5 text-[#B06F5E]" />
              <span>Add Hero Slide</span>
            </button>
          )}
        </div>

        {/* Slide Edit Form */}
        {editingSlide && (
          <form onSubmit={handleSaveSlide} className="p-5 bg-[#FAF6F0] rounded-sm border border-[#E8DDD1] space-y-4">
            <h3 className="font-serif text-base text-[#2B211C]">
              {editingSlide.id ? "Edit Hero Slide" : "New Hero Slide"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Eyebrow (Default: "PREMIUM BRIDAL RENTAL")
                </label>
                <input
                  type="text"
                  value={editingSlide.eyebrow || ""}
                  onChange={(e) => setEditingSlide({ ...editingSlide, eyebrow: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Main Editorial Heading *
                </label>
                <input
                  type="text"
                  required
                  value={editingSlide.heading || ""}
                  onChange={(e) => setEditingSlide({ ...editingSlide, heading: e.target.value })}
                  placeholder="Grace for Every Occasion"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Supporting Text
              </label>
              <input
                type="text"
                value={editingSlide.body || ""}
                onChange={(e) => setEditingSlide({ ...editingSlide, body: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                  CTA Label
                </label>
                <input
                  type="text"
                  value={editingSlide.cta_label || "Explore Collections"}
                  onChange={(e) => setEditingSlide({ ...editingSlide, cta_label: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                  CTA Destination
                </label>
                <input
                  type="text"
                  value={editingSlide.cta_href || "/collections"}
                  onChange={(e) => setEditingSlide({ ...editingSlide, cta_href: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Side Editorial Phrase
                </label>
                <input
                  type="text"
                  value={editingSlide.side_text || "The Art of Dressing Your Moments"}
                  onChange={(e) => setEditingSlide({ ...editingSlide, side_text: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2">
                Large Bridal Photograph (Cloudinary)
              </label>
              <CloudinaryUploader
                role="hero"
                multiple={false}
                assets={slideAssets}
                onChange={setSlideAssets}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DDD1]">
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="px-4 py-2 border border-[#E8DDD1] text-xs font-medium rounded-sm text-[#7A6A5F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium uppercase tracking-wider rounded-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Slide"}
              </button>
            </div>
          </form>
        )}

        {/* Existing Slides List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {slides.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-white border border-[#E8DDD1] rounded-sm flex gap-4 items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative aspect-[4/5] w-14 rounded-xs overflow-hidden bg-[#FAF6F0] shrink-0">
                  {s.image_url ? (
                    <Image src={s.image_url} alt="" fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#7A6A5F]">
                      Haya
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-serif text-base text-[#2B211C] font-normal leading-snug">
                    {s.heading}
                  </h4>
                  <span className="text-[11px] text-[#7A6A5F] block font-light">
                    {s.eyebrow}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEditSlide(s)}
                  className="p-1.5 text-[#7A6A5F] hover:text-[#B06F5E]"
                  title="Edit slide"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSlide(s.id)}
                  className="p-1.5 text-[#7A6A5F] hover:text-red-600"
                  title="Delete slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
