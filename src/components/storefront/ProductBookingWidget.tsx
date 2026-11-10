"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Share2,
  CheckCircle2,
  Gem,
  Scissors,
  Truck,
  CreditCard,
  X,
  Send,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { SizeGuideModal } from "./SizeGuideModal";
import type { ProductWithImages, RentalOption, SizeGuide } from "@/lib/types";

interface ProductBookingWidgetProps {
  product: ProductWithImages & {
    product_rental_options?: RentalOption[];
    size_guide?: SizeGuide | null;
  };
  shipping?: {
    fee_paise: number;
    free_shipping_threshold_paise?: number;
    label: string;
    estimated_days: string;
  };
  boutiquePhone?: string | null;
  initialWishlisted?: boolean;
}

function cleanWhatsAppPhone(phone?: string | null): string {
  if (!phone) return "919876543210";
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits || "919876543210";
}

export function ProductBookingWidget({
  product,
  shipping,
  boutiquePhone,
  initialWishlisted = false,
}: ProductBookingWidgetProps) {
  const router = useRouter();

  const isOrnament = product.category === "ornament" || product.category === "ornaments";
  const pricePaise = product.price_paise ?? product.rental_price_paise;

  // Shipping details from admin settings
  const feePaise = Number(shipping?.fee_paise) || 0;
  const shippingAmountPaise = feePaise;
  const shippingLabelText = shipping?.label || "Insured Express Delivery";
  const estimatedDeliveryText = shipping?.estimated_days || "3-5 Business Days";

  // Selected options
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors[0]?.name || ""
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes[0] || (isOrnament ? "Free Size" : "M")
  );

  // Customization state for dress items
  const [isCustomFit, setIsCustomFit] = useState(false);
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [shoulder, setShoulder] = useState("");
  const [length, setLength] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  // Customer Contact Fields for Dress WhatsApp Order
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientEventDate, setClientEventDate] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dressFormError, setDressFormError] = useState<string | null>(null);
  const [dressSubmitting, setDressSubmitting] = useState(false);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);

  // Modals & UI states
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistToggling, setWishlistToggling] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleToggleWishlist = async () => {
    if (wishlistToggling) return;
    setWishlistToggling(true);
    const nextState = !wishlisted;
    setWishlisted(nextState);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, action: nextState ? "add" : "remove" }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!res.ok) setWishlisted(!nextState);
    } catch {
      setWishlisted(!nextState);
    } finally {
      setWishlistToggling(false);
    }
  };

  // Form states for general enquiry modal
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Action for Ornaments (Proceed to direct Cashfree Checkout)
  const handleProceedBuy = () => {
    const query = new URLSearchParams({
      size: selectedSize,
      ...(selectedColor ? { color: selectedColor } : {}),
    });
    router.push(`/book/${product.slug}?${query.toString()}`);
  };

  // Action for Dresses (Customization + WhatsApp Order)
  const handleWhatsAppDressOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDressFormError(null);

    if (!clientName.trim()) {
      setDressFormError("Please enter your full name.");
      return;
    }
    if (!clientPhone.trim()) {
      setDressFormError("Please enter your WhatsApp / phone number.");
      return;
    }

    setDressSubmitting(true);

    try {
      // 1. Build measurements summary
      const measurementsSummary = isCustomFit
        ? `Bespoke Custom Fit [Bust: ${bust || "To verify"}", Waist: ${waist || "To verify"}", Hips: ${hips || "To verify"}", Shoulder: ${shoulder || "Standard"}", Length: ${length || "Standard"}"]`
        : `Standard Size (${selectedSize})`;

      const fullMessage = [
        `Bridal Dress Customization Order for ${product.name}`,
        product.collection?.name ? `• Collection: ${product.collection.name}` : null,
        `• Item Price: ${formatINR(pricePaise)}`,
        `• Selected Color: ${selectedColor || "As displayed"}`,
        `• Sizing: ${measurementsSummary}`,
        clientCity.trim() ? `• Delivery City / Location: ${clientCity.trim()}` : null,
        clientEventDate ? `• Wedding / Event Date: ${clientEventDate}` : null,
        customNotes.trim() ? `• Styling Preferences / Notes: ${customNotes.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      // 2. Persist to enquiries in database for admin visibility
      const fallbackEmail =
        clientEmail.trim() ||
        `${clientPhone.replace(/\D/g, "") || "client"}@whatsapp.guest`;

      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          kind: "product",
          name: clientName.trim(),
          email: fallbackEmail,
          phone: clientPhone.trim(),
          size: isCustomFit ? "Custom Fit" : selectedSize,
          preferred_date: clientEventDate || null,
          message: fullMessage,
        }),
      }).catch((err) => console.error("[enquiry save error]", err));

      // 3. Build comprehensive WhatsApp order ticket
      const productUrl =
        typeof window !== "undefined" ? window.location.href : "";

      const waTextParts = [
        `✨ *NEW BRIDAL DRESS CUSTOM ORDER* ✨`,
        `*Haya Bridal Couture*`,
        `────────────────────────────`,
        `🛍️ *PRODUCT DETAILS*`,
        `• *Outfit:* ${product.name}`,
        product.collection?.name ? `• *Collection:* ${product.collection.name}` : null,
        `• *Price:* ${formatINR(pricePaise)}`,
        `• *Color Chosen:* ${selectedColor || "As Displayed"}`,
        productUrl ? `• *Item Link:* ${productUrl}` : null,
        ``,
        `👗 *DRESS CUSTOMIZATION & SIZING*`,
        `• *Sizing Mode:* ${isCustomFit ? "Bespoke Custom Tailoring" : `Standard Size (${selectedSize})`}`,
      ];

      if (isCustomFit) {
        waTextParts.push(
          `📐 *Tailoring Measurements:*`,
          `  - Bust: ${bust ? `${bust}"` : "To be confirmed"}`,
          `  - Waist: ${waist ? `${waist}"` : "To be confirmed"}`,
          `  - Hips: ${hips ? `${hips}"` : "To be confirmed"}`,
          `  - Shoulder: ${shoulder ? `${shoulder}"` : "Standard"}`,
          `  - Length / Height: ${length ? `${length}"` : "Standard"}`
        );
      }

      waTextParts.push(
        `• *Styling / Blouse Notes:* ${customNotes.trim() || "Standard styling as per catalog"}`,
        ``,
        `👤 *CUSTOMER CONTACT DETAILS*`,
        `• *Client Name:* ${clientName.trim()}`,
        `• *WhatsApp Number:* ${clientPhone.trim()}`,
        clientEmail.trim() ? `• *Email:* ${clientEmail.trim()}` : null,
        clientCity.trim() ? `• *Delivery City / Location:* ${clientCity.trim()}` : null,
        clientEventDate ? `• *Wedding / Event Date:* ${clientEventDate}` : null,
        `────────────────────────────`,
        `🌸 _Please review my customization request and confirm the stitching schedule & delivery timeline._`
      );

      const waText = waTextParts.filter(Boolean).join("\n");
      const targetPhone = cleanWhatsAppPhone(boutiquePhone);
      const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waText)}`;

      setLastWhatsAppUrl(whatsappUrl);

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");
    } finally {
      setDressSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch {}
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.name || !enquiryForm.email || !enquiryForm.message) return;
    setEnquirySubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          kind: "product",
          name: enquiryForm.name,
          email: enquiryForm.email,
          phone: enquiryForm.phone,
          size: selectedSize,
          message: enquiryForm.message,
        }),
      });
      if (res.ok) {
        setEnquirySuccess(true);
      }
    } catch {
      // Handled gracefully
    } finally {
      setEnquirySubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Category & Collection Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            {isOrnament ? "Fine Ornaments" : "Bridal Couture"}
          </span>
          {product.collection?.name && (
            <>
              <span className="text-[#D4C3B2]">•</span>
              <span className="text-[11px] text-[#7A6A5F] font-sans">
                {product.collection.name}
              </span>
            </>
          )}
        </div>

        {/* Wishlist & Share Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistToggling}
            className="p-2.5 rounded-full border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] hover:text-[#B06F5E] transition-colors"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-4 h-4 ${
                wishlisted ? "fill-[#B06F5E] text-[#B06F5E]" : "stroke-[1.6]"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 rounded-full border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] hover:text-[#B06F5E] transition-colors relative"
            aria-label="Share"
            title="Share item"
          >
            <Share2 className="w-4 h-4 stroke-[1.6]" />
            {copiedShare && (
              <span className="absolute -bottom-7 right-0 text-[10px] bg-[#2B211C] text-white px-2 py-0.5 rounded-xs whitespace-nowrap">
                Link copied
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Product Title */}
      <h1 className="font-serif text-2xl sm:text-3xl text-[#2B211C] font-normal tracking-tight mt-3">
        {product.name}
      </h1>

      {/* Price Display */}
      <div className="mt-4 pb-5 border-b border-[#E8DDD1]">
        <div className="flex items-baseline gap-3">
          <span className="font-sans text-3xl sm:text-4xl font-semibold text-[#2B211C]">
            {formatINR(pricePaise)}
          </span>
          {product.compare_at_price_paise && product.compare_at_price_paise > pricePaise && (
            <span className="text-base text-[#7A6A5F] line-through font-sans">
              {formatINR(product.compare_at_price_paise)}
            </span>
          )}
          {shippingAmountPaise > 0 && (
            <span className="text-xs text-[#7A6A5F] font-medium bg-[#FAF6F0] px-2 py-0.5 rounded-xs border border-[#E8DDD1]">
              +{formatINR(shippingAmountPaise)} Shipping
            </span>
          )}
        </div>
        <p className="text-xs text-[#7A6A5F] mt-1.5 font-sans font-light flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-[#B06F5E]" />
          <span>
            {shippingLabelText}
            {shippingAmountPaise > 0 ? ` (${formatINR(shippingAmountPaise)})` : ""}
            {estimatedDeliveryText ? ` • Delivery within ${estimatedDeliveryText}` : ""}.
          </span>
        </p>
      </div>

      {/* Short Description */}
      <div className="mt-5 text-xs sm:text-sm text-[#7A6A5F] leading-relaxed font-light">
        <p>{product.short_description || product.description}</p>
      </div>

      {/* Color Selection */}
      {product.colors.length > 0 && (
        <div className="mt-6">
          <label className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2.5">
            Color: <span className="font-normal text-[#7A6A5F] capitalize">{selectedColor}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const isSelected = selectedColor === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs transition-all ${
                    isSelected
                      ? "border-[#B06F5E] bg-[#FFFDF9] ring-1 ring-[#B06F5E] text-[#2B211C]"
                      : "border-[#E8DDD1] bg-white text-[#7A6A5F] hover:border-[#D4C3B2]"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: DRESS BESPOKE CUSTOMIZATION & WHATSAPP ORDER FORM              */}
      {/* ========================================================================= */}
      {!isOrnament && (
        <div className="mt-6 space-y-5">
          {/* Sizing Header & Guide */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#2B211C] uppercase tracking-wider">
              1. Choose Sizing Mode
            </label>
            {product.size_guide && (
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs text-[#B06F5E] hover:underline flex items-center gap-1 font-sans"
              >
                <Scissors className="w-3 h-3" />
                Size Guide
              </button>
            )}
          </div>

          {/* Sizing Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4ECE1]/60 rounded-sm border border-[#E8DDD1]">
            <button
              type="button"
              onClick={() => setIsCustomFit(false)}
              className={`py-2 px-3 text-xs font-medium rounded-xs transition-all text-center ${
                !isCustomFit
                  ? "bg-white text-[#2B211C] shadow-xs border border-[#E8DDD1]"
                  : "text-[#7A6A5F] hover:text-[#2B211C]"
              }`}
            >
              Standard Size
            </button>
            <button
              type="button"
              onClick={() => setIsCustomFit(true)}
              className={`py-2 px-3 text-xs font-medium rounded-xs transition-all text-center flex items-center justify-center gap-1.5 ${
                isCustomFit
                  ? "bg-[#B06F5E] text-white shadow-xs"
                  : "text-[#7A6A5F] hover:text-[#2B211C]"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Custom Measurements
            </button>
          </div>

          {/* Standard Size Buttons */}
          {!isCustomFit && product.sizes.length > 0 && (
            <div className="pt-1">
              <span className="block text-[11px] text-[#7A6A5F] mb-2">
                Select your standard dress size:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[48px] h-10 px-3.5 text-xs font-medium rounded-sm border transition-all flex items-center justify-center ${
                        isSelected
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
          )}

          {/* Custom Measurements Inputs */}
          {isCustomFit && (
            <div className="p-4 bg-[#FFFDF9] border border-[#B06F5E]/40 rounded-sm space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-medium text-[#B06F5E]">
                <Scissors className="w-4 h-4" />
                <span>Custom Bridal Measurements (Complimentary)</span>
              </div>
              <p className="text-[11px] text-[#7A6A5F] leading-relaxed">
                Provide your body measurements in inches below. Our master artisans will tailor the dress to your silhouette.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Bust (Inches) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 34"
                    value={bust}
                    onChange={(e) => setBust(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Waist (Inches) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 28"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Hips (Inches) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 38"
                    value={hips}
                    onChange={(e) => setHips(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Shoulder (Inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 14"
                    value={shoulder}
                    onChange={(e) => setShoulder(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Length / Height
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 42"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer Contact & Request Form Card */}
          <div className="p-4 bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm space-y-3.5">
            <span className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider">
              2. Your Order &amp; WhatsApp Details
            </span>

            {dressFormError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dressFormError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ayesha Khan"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Delivery City / Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad, Telangana"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Wedding / Event Date (Optional)
                </label>
                <input
                  type="date"
                  value={clientEventDate}
                  onChange={(e) => setClientEventDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="ayesha@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                Customization Notes &amp; Blouse Preferences
              </label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Sleeves: 3/4 length, Neckline preference, Fabric color alteration, or special delivery timing..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E] resize-none"
              />
            </div>
          </div>

          {/* Dedicated WhatsApp Action Button for Dresses */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleWhatsAppDressOrder}
              disabled={dressSubmitting}
              className="w-full py-4 px-6 rounded-sm bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5 fill-white/20 stroke-[1.8]" />
              <span>
                {dressSubmitting ? "Connecting to WhatsApp..." : "Order & Customize on WhatsApp"}
              </span>
            </button>
            <p className="text-[11px] text-center text-[#7A6A5F] mt-2">
              Our bridal master tailor &amp; stylist will confirm your measurements and finalize your order directly on WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: ORNAMENT DIRECT CASHFREE BUY ACTION                            */}
      {/* ========================================================================= */}
      {isOrnament && (
        <div className="mt-6 space-y-4">
          {/* Jewelry Specifications Card */}
          <div className="p-4 bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#2B211C]">
              <Gem className="w-4 h-4 text-[#B06F5E]" />
              <span>Artisan Jewelry Specifications</span>
            </div>
            <p className="text-xs text-[#7A6A5F] leading-relaxed">
              Handcrafted with 22K gold micro-plating, semi-precious stones, and freshwater pearls. Delivered in a luxury velvet trunk with certificate of authenticity.
            </p>
          </div>

          {/* Online Payment Notice (No COD Available) */}
          <div className="p-3.5 bg-[#FAF6F0] border border-[#E8DDD1] rounded-sm flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-[#B06F5E] shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-medium text-[#2B211C]">
                Prepaid Online Payment (Cards, UPI, NetBanking)
              </p>
              <p className="text-[11px] text-[#7A6A5F]">
                100% encrypted &amp; secure payment gateway. Note: Cash on Delivery (COD) is not available.
              </p>
            </div>
          </div>

          {/* Action Buttons for Ornaments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEnquiryOpen(true)}
              className="w-full py-3.5 px-6 rounded-sm border border-[#E8DDD1] hover:border-[#B06F5E] bg-white text-[#2B211C] text-xs font-medium tracking-wide uppercase transition-colors text-center shadow-xs"
            >
              Enquire / Ask Stylist
            </button>

            <button
              type="button"
              onClick={handleProceedBuy}
              className="w-full py-3.5 px-6 rounded-sm bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase transition-colors text-center shadow-xs flex items-center justify-center gap-2"
            >
              <span>Buy Now • {formatINR(pricePaise)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar on Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#E8DDD1] p-3 px-4 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-xs font-semibold text-[#2B211C]">
            {formatINR(pricePaise)}
          </span>
          <span className="text-[10px] text-[#7A6A5F] block">
            {isOrnament ? "Fine Ornament" : isCustomFit ? "Custom Tailored" : `Size: ${selectedSize}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOrnament ? (
            <>
              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                className="px-3 py-2 rounded-sm border border-[#E8DDD1] bg-white text-xs font-medium text-[#2B211C]"
              >
                Enquire
              </button>
              <button
                type="button"
                onClick={handleProceedBuy}
                className="px-5 py-2 rounded-sm bg-[#B06F5E] text-white text-xs font-medium tracking-wide shadow-xs"
              >
                Buy Now
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleWhatsAppDressOrder}
              disabled={dressSubmitting}
              className="px-4 py-2.5 rounded-sm bg-[#25D366] text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Size Guide Modal */}
      {product.size_guide && (
        <SizeGuideModal
          isOpen={sizeGuideOpen}
          sizeGuide={product.size_guide}
          onClose={() => setSizeGuideOpen(false)}
        />
      )}

      {/* General Enquiry Modal (Used by Ornaments or stylist question) */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm max-w-lg w-full p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => {
                setEnquiryOpen(false);
                setEnquirySuccess(false);
              }}
              className="absolute top-4 right-4 text-[#7A6A5F] hover:text-[#2B211C]"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {enquirySuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <h3 className="font-serif text-xl text-[#2B211C]">
                  Styling Enquiry Received
                </h3>
                <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto leading-relaxed">
                  Thank you for your interest in <strong className="text-[#2B211C]">{product.name}</strong>. Our bridal consultant will reach out via WhatsApp or phone within 2 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEnquiryOpen(false);
                    setEnquirySuccess(false);
                  }}
                  className="px-6 py-2 bg-[#B06F5E] text-white text-xs rounded-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
                    Concierge Assistance
                  </span>
                  <h3 className="font-serif text-xl text-[#2B211C] mt-0.5">
                    Enquire About {product.name}
                  </h3>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#7A6A5F] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E8DDD1] rounded-sm"
                    placeholder="e.g. Fatima Ali"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase text-[#7A6A5F] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#E8DDD1] rounded-sm"
                      placeholder="fatima@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-[#7A6A5F] mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#E8DDD1] rounded-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#7A6A5F] mb-1">
                    Your Question / Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    className="w-full p-2.5 text-xs border border-[#E8DDD1] rounded-sm resize-none"
                    placeholder="Tell us about the pieces you are interested in..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEnquiryOpen(false)}
                    className="px-4 py-2 border border-[#E8DDD1] text-xs rounded-sm text-[#7A6A5F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    className="px-6 py-2 bg-[#B06F5E] text-white text-xs rounded-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{enquirySubmitting ? "Sending..." : "Submit Enquiry"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
