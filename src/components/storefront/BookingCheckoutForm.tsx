"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatINR, computeRentalPrice } from "@/lib/money";
import { rentalEndDate, formatDate } from "@/lib/dates";
import type { ProductWithImages, RentalOption, SiteSettings } from "@/lib/types";

interface BookingCheckoutFormProps {
  product: ProductWithImages & { product_rental_options: RentalOption[] };
  user: { id: string; email?: string | null };
  settings: SiteSettings;
  initialDuration: number;
  initialSize: string;
  initialColor: string;
  initialStart: string;
}

export function BookingCheckoutForm({
  product,
  user,
  settings,
  initialDuration,
  initialSize,
  initialColor,
  initialStart,
}: BookingCheckoutFormProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState(initialStart);
  const [duration, setDuration] = useState(initialDuration);
  const [size, setSize] = useState(initialSize);
  const [color, setColor] = useState(initialColor);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const primaryImage =
    product.product_images.find((img) => img.is_primary) ||
    product.product_images[0];

  const priceBreakdown = computeRentalPrice({
    basePricePaise: product.rental_price_paise,
    baseDurationDays: product.rental_duration_days,
    options: product.product_rental_options,
    durationDays: duration,
    depositPaise: product.deposit_paise,
    feesPaise: settings.booking?.fees_paise || 0,
  });

  const endDate = startDate ? rentalEndDate(startDate, duration) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!startDate) {
      setErrorMsg("Please select a rental start date.");
      return;
    }
    if (!customerName || !phone) {
      setErrorMsg("Please provide your full name and contact phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          start_date: startDate,
          duration_days: duration,
          size,
          color,
          name: customerName,
          email: user.email,
          phone,
          address,
          event_date: eventDate || null,
          notes,
          workflow: settings.booking?.workflow || "request",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create reservation hold.");
      }

      // If workflow is online payment, proceed to checkout page
      if (settings.booking?.workflow === "payment") {
        router.push(`/checkout/${data.reference}`);
      } else {
        // Request workflow: proceed directly to confirmation
        router.push(`/booking/confirmation/${data.reference}`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Booking could not be processed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left Details Form */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Reservation Parameters Card */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B211C] font-normal pb-3 border-b border-[#E8DDD1]">
            1. Rental Dates & Size
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Rental Start Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Duration (Days) *
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              >
                <option value={product.rental_duration_days}>
                  {product.rental_duration_days} Days
                </option>
                {product.product_rental_options.map((opt) => (
                  <option key={opt.duration_days} value={opt.duration_days}>
                    {opt.duration_days} Days
                  </option>
                ))}
              </select>
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-3 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] flex items-center justify-between text-xs text-[#2B211C]">
              <span>Rental Period:</span>
              <span className="font-semibold text-[#B06F5E]">
                {formatDate(startDate)} &rarr; {formatDate(endDate)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {product.sizes.length > 0 && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Selected Size *
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                >
                  {product.sizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {product.colors.length > 0 && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                  Selected Color
                </label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                >
                  {product.colors.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Customer Fulfillment Card */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl text-[#2B211C] font-normal pb-3 border-b border-[#E8DDD1]">
            2. Customer & Event Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Bride or groom name"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user.email || ""}
                className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDD1] rounded-sm text-[#7A6A5F]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Event Date (Optional)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Delivery / Studio Fitting Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="City, Area, Pincode"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Custom Measurements & Alteration Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mention your blouse bust size, height for lehenga length, or trial date preference..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>
        </div>
      </div>

      {/* Right Order Summary & Pricing Breakdown */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-sm sticky top-28">
          <h2 className="font-serif text-xl text-[#2B211C] font-normal pb-4 border-b border-[#E8DDD1]">
            Booking Summary
          </h2>

          {/* Outfit Thumbnail & Name */}
          <div className="flex gap-4 py-4 border-b border-[#E8DDD1]">
            <div className="relative aspect-[3/4] w-20 rounded-xs overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shrink-0">
              {primaryImage?.url ? (
                <Image src={primaryImage.url} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-[#7A6A5F]">
                  Haya
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-serif text-base text-[#2B211C] leading-snug">
                {product.name}
              </span>
              <span className="text-xs text-[#7A6A5F] mt-1">
                {duration} Days Rental • Size: {size || "Standard"}
              </span>
              {color && (
                <span className="text-xs text-[#7A6A5F]">Color: {color}</span>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          {priceBreakdown && (
            <div className="py-4 space-y-2.5 text-xs text-[#7A6A5F] border-b border-[#E8DDD1]">
              <div className="flex justify-between">
                <span>Rental Charge ({duration} Days)</span>
                <span className="text-[#2B211C] font-medium font-sans">
                  {formatINR(priceBreakdown.rental_paise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Refundable Security Deposit</span>
                <span className="text-[#2B211C] font-medium font-sans">
                  {formatINR(priceBreakdown.deposit_paise)}
                </span>
              </div>
              {priceBreakdown.fees_paise > 0 && (
                <div className="flex justify-between">
                  <span>Service & Fitting Fee</span>
                  <span className="text-[#2B211C] font-medium font-sans">
                    {formatINR(priceBreakdown.fees_paise)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-emerald-700">
                <span>Professional Sanitization & Fitting</span>
                <span>Included (Free)</span>
              </div>
            </div>
          )}

          {/* Total Payable */}
          {priceBreakdown && (
            <div className="py-4 flex items-baseline justify-between border-b border-[#E8DDD1]">
              <span className="font-serif text-lg text-[#2B211C]">Total Payable</span>
              <span className="font-sans text-2xl font-bold text-[#B06F5E]">
                {formatINR(priceBreakdown.total_paise)}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Holding Reservation..." : "Proceed to Confirmation"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#7A6A5F]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Guaranteed Date Reservation • Museum Cleaned</span>
          </div>
        </div>
      </div>
    </form>
  );
}
