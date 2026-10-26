"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Share2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Scissors,
  ShieldCheck,
  RotateCcw,
  X,
  Send,
} from "lucide-react";
import { formatINR, durationChoices } from "@/lib/money";
import { SizeGuideModal } from "./SizeGuideModal";
import type { ProductWithImages, RentalOption, SizeGuide } from "@/lib/types";

interface ProductBookingWidgetProps {
  product: ProductWithImages & {
    product_rental_options: RentalOption[];
    size_guide: SizeGuide | null;
  };
}

export function ProductBookingWidget({ product }: ProductBookingWidgetProps) {
  const router = useRouter();

  // Selected options
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors[0]?.name || ""
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes[0] || ""
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(
    product.rental_duration_days
  );

  // Date selection & availability check
  const [startDate, setStartDate] = useState<string>("");
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState<{
    checked: boolean;
    available: boolean;
    reason?: string | null;
  }>({ checked: false, available: true });

  // Modals & wishlist
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Form states for enquiry
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Calculate pricing based on duration
  const durations = durationChoices({
    rental_duration_days: product.rental_duration_days,
    rental_price_paise: product.rental_price_paise,
    options: product.product_rental_options,
  });

  const activeDurationChoice =
    durations.find((d) => d.duration_days === selectedDuration) || durations[0];
  const currentPricePaise =
    activeDurationChoice?.price_paise ?? product.rental_price_paise;

  // Check availability when date or duration changes
  const checkAvailability = async (newDate: string, duration: number) => {
    if (!newDate) {
      setAvailResult({ checked: false, available: true });
      return;
    }
    setIsCheckingAvail(true);
    try {
      const res = await fetch(
        `/api/availability?product_id=${product.id}&start=${newDate}&duration=${duration}`
      );
      const data = await res.json();
      setAvailResult({
        checked: true,
        available: data.available,
        reason: data.reason,
      });
    } catch {
      setAvailResult({ checked: true, available: true });
    } finally {
      setIsCheckingAvail(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    checkAvailability(val, selectedDuration);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dur = parseInt(e.target.value, 10);
    setSelectedDuration(dur);
    if (startDate) checkAvailability(startDate, dur);
  };

  const handleProceedBooking = () => {
    const query = new URLSearchParams({
      duration: String(selectedDuration),
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(selectedColor ? { color: selectedColor } : {}),
      ...(startDate ? { start: startDate } : {}),
    });
    router.push(`/book/${product.slug}?${query.toString()}`);
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
          preferred_date: startDate || null,
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
      {/* Title & Actions Row matching Reference 05 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2B211C] font-normal tracking-tight">
            {product.name}
          </h1>
          {product.collection && (
            <p className="text-xs uppercase tracking-widest text-[#7A6A5F] mt-1 font-sans">
              {product.collection.name}
            </p>
          )}
        </div>

        {/* Wishlist & Share Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setWishlisted(!wishlisted)}
            className="p-2.5 rounded-full border border-[#E8DDD1] hover:border-[#B06F5E] text-[#2B211C] hover:text-[#B06F5E] transition-colors"
            aria-label="Wishlist"
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
            title="Share outfit"
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

      {/* Price & Deposit Notice matching Reference 05 */}
      <div className="mt-4 pb-5 border-b border-[#E8DDD1]">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-2xl sm:text-3xl font-semibold text-[#2B211C]">
            {formatINR(currentPricePaise)}
          </span>
          <span className="text-sm text-[#7A6A5F] font-sans">
            / {selectedDuration} Days
          </span>
        </div>
        <p className="text-xs text-[#7A6A5F] mt-1 font-sans font-light">
          (Security deposit applicable
          {product.deposit_paise > 0
            ? `: ${formatINR(product.deposit_paise)} fully refundable upon return`
            : ""}
          )
        </p>
      </div>

      {/* Short Description */}
      <div className="mt-5 text-xs sm:text-sm text-[#7A6A5F] leading-relaxed font-light">
        <p>{product.short_description || product.description}</p>
      </div>

      {/* Color Selection matching Reference 05 */}
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

      {/* Size Selection & Size Guide Modal Link matching Reference 05 */}
      {product.sizes.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-medium text-[#2B211C] uppercase tracking-wider">
              Size
            </label>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="text-xs text-[#B06F5E] hover:underline flex items-center gap-1 font-sans"
            >
              <Scissors className="w-3 h-3" />
              Size Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((sz) => {
              const isSelected = selectedSize === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[44px] h-10 px-3 text-xs font-medium rounded-sm border transition-all flex items-center justify-center ${
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

      {/* Rental Duration & Rental Date Picker matching Reference 05 */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rental Duration Dropdown */}
        <div>
          <label
            htmlFor="duration-select"
            className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2"
          >
            Rental Duration
          </label>
          <div className="relative">
            <select
              id="duration-select"
              value={selectedDuration}
              onChange={handleDurationChange}
              className="w-full px-3 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            >
              {durations.map((d) => (
                <option key={d.duration_days} value={d.duration_days}>
                  {d.duration_days} Days — {formatINR(d.price_paise)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rental Start Date Picker */}
        <div>
          <label
            htmlFor="rental-date"
            className="block text-xs font-medium text-[#2B211C] uppercase tracking-wider mb-2"
          >
            Rental Start Date
          </label>
          <div className="relative">
            <input
              id="rental-date"
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={handleDateChange}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>
        </div>
      </div>

      {/* Availability Status Badge matching Reference 05 & 06 */}
      <div className="mt-4 flex items-center gap-2 text-xs">
        {isCheckingAvail ? (
          <span className="text-[#7A6A5F] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Checking studio availability...
          </span>
        ) : startDate && !availResult.available ? (
          <span className="text-amber-700 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {availResult.reason || "Outfit currently booked for these dates."}
          </span>
        ) : (
          <span className="text-emerald-700 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            In Stock & Available for Rent
          </span>
        )}
      </div>

      {/* Action Buttons Row matching Reference 05: "Enquire Now" & "Book Appointment / Book Now" */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setEnquiryOpen(true)}
          className="w-full py-3.5 px-6 rounded-sm border border-[#E8DDD1] hover:border-[#B06F5E] bg-white text-[#2B211C] text-xs font-medium tracking-wide uppercase transition-colors text-center shadow-xs"
        >
          Enquire Now
        </button>

        <button
          type="button"
          onClick={handleProceedBooking}
          disabled={startDate !== "" && !availResult.available}
          className="w-full py-3.5 px-6 rounded-sm bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase transition-colors text-center shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Book Appointment
        </button>
      </div>

      {/* Service Trust Information Row matching Reference 05 */}
      <div className="mt-10 pt-8 border-t border-[#E8DDD1] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="flex flex-col items-center text-center p-3 rounded-xs bg-[#F4ECE1]/60">
          <Scissors className="w-4 h-4 text-[#B06F5E] mb-1.5" />
          <span className="font-medium text-[#2B211C]">Personal Styling</span>
          <span className="text-[10px] text-[#7A6A5F]">Assistance</span>
        </div>
        <div className="flex flex-col items-center text-center p-3 rounded-xs bg-[#F4ECE1]/60">
          <Sparkles className="w-4 h-4 text-[#B06F5E] mb-1.5" />
          <span className="font-medium text-[#2B211C]">Customization</span>
          <span className="text-[10px] text-[#7A6A5F]">Available</span>
        </div>
        <div className="flex flex-col items-center text-center p-3 rounded-xs bg-[#F4ECE1]/60">
          <ShieldCheck className="w-4 h-4 text-[#B06F5E] mb-1.5" />
          <span className="font-medium text-[#2B211C]">Secure Payment</span>
          <span className="text-[10px] text-[#7A6A5F]">Verified</span>
        </div>
        <div className="flex flex-col items-center text-center p-3 rounded-xs bg-[#F4ECE1]/60">
          <RotateCcw className="w-4 h-4 text-[#B06F5E] mb-1.5" />
          <span className="font-medium text-[#2B211C]">Hassle Free</span>
          <span className="text-[10px] text-[#7A6A5F]">Pickup & Return</span>
        </div>
      </div>

      {/* Sticky Bottom Action Bar on Mobile matching Reference 06 */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#E8DDD1] p-3 px-4 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-xs font-semibold text-[#2B211C]">
            {formatINR(currentPricePaise)}
          </span>
          <span className="text-[10px] text-[#7A6A5F] block">
            {selectedDuration} Days Rental
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEnquiryOpen(true)}
            className="px-3 py-2 rounded-sm border border-[#E8DDD1] bg-white text-xs font-medium text-[#2B211C]"
          >
            Enquire
          </button>
          <button
            type="button"
            onClick={handleProceedBooking}
            className="px-4 py-2 rounded-sm bg-[#B06F5E] text-white text-xs font-medium tracking-wide shadow-xs"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        sizeGuide={product.size_guide}
      />

      {/* Product Enquiry Modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setEnquiryOpen(false)}
          />
          <div className="relative bg-[#FFFDF9] rounded-sm border border-[#E8DDD1] shadow-2xl max-w-md w-full p-6 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
              <h3 className="font-serif text-xl text-[#2B211C]">
                Enquire About Outfit
              </h3>
              <button
                type="button"
                onClick={() => setEnquiryOpen(false)}
                className="p-1 text-[#7A6A5F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif text-lg text-[#2B211C] mb-1">
                  Enquiry Received
                </h4>
                <p className="text-xs text-[#7A6A5F] mb-6">
                  Thank you! Our styling concierge will contact you via email or phone within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEnquiryOpen(false);
                    setEnquirySuccess(false);
                  }}
                  className="px-5 py-2 bg-[#B06F5E] text-white text-xs font-medium rounded-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="mt-4 space-y-3.5">
                <p className="text-xs text-[#7A6A5F]">
                  Outfit: <strong className="text-[#2B211C]">{product.name}</strong>
                </p>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) =>
                      setEnquiryForm({ ...enquiryForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={enquiryForm.email}
                      onChange={(e) =>
                        setEnquiryForm({ ...enquiryForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={enquiryForm.phone}
                      onChange={(e) =>
                        setEnquiryForm({ ...enquiryForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7A6A5F] mb-1">
                    Message / Questions *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={enquiryForm.message}
                    onChange={(e) =>
                      setEnquiryForm({ ...enquiryForm, message: e.target.value })
                    }
                    placeholder="Ask about sizing, matching jewelry, blouse alteration, or trial dates..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    className="w-full py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
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
