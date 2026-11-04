"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import type { ProductWithImages, RentalOption, SiteSettings } from "@/lib/types";
import type { CustomerPrefill } from "@/lib/customer";

interface BookingCheckoutFormProps {
  product: ProductWithImages & { product_rental_options?: RentalOption[] };
  prefill: CustomerPrefill;
  settings: SiteSettings;
  initialDuration?: number;
  initialSize: string;
  initialColor: string;
  initialStart?: string;
  initialIsCustom?: boolean;
  initialBust?: string;
  initialWaist?: string;
  initialHips?: string;
  initialShoulder?: string;
  initialLength?: string;
  initialCustomNotes?: string;
}

export function BookingCheckoutForm({
  product,
  prefill,
  settings,
  initialSize,
  initialColor,
  initialIsCustom = false,
  initialBust = "",
  initialWaist = "",
  initialHips = "",
  initialShoulder = "",
  initialLength = "",
  initialCustomNotes = "",
}: BookingCheckoutFormProps) {
  const router = useRouter();

  const isOrnament = product.category === "ornament" || product.category === "ornaments";

  // Product Selection States
  const [size, setSize] = useState(initialSize);
  const [color, setColor] = useState(initialColor);
  const [isCustom, setIsCustom] = useState(initialIsCustom);
  const [bust, setBust] = useState(initialBust);
  const [waist, setWaist] = useState(initialWaist);
  const [hips, setHips] = useState(initialHips);
  const [shoulder, setShoulder] = useState(initialShoulder);
  const [length, setLength] = useState(initialLength);
  const [customNotes, setCustomNotes] = useState(initialCustomNotes);

  // Customer Shipping & Delivery Details
  const [customerName, setCustomerName] = useState(prefill.name);
  const [email, setEmail] = useState(prefill.email);
  const [phone, setPhone] = useState(prefill.phone);
  const [streetAddress, setStreetAddress] = useState(prefill.address.line1);
  const [city, setCity] = useState(prefill.address.city);
  const [stateName, setStateName] = useState(prefill.address.state);
  const [pincode, setPincode] = useState(prefill.address.pincode);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const primaryImage =
    product.product_images.find((img) => img.is_primary) ||
    product.product_images[0];

  const pricePaise = product.price_paise ?? product.rental_price_paise;

  // Dynamic Shipping Calculation from Admin Settings (Zero GST)
  const shippingSettings = settings?.shipping;
  const activeShippingPaise = Number(shippingSettings?.fee_paise) || 0;
  const shippingLabelText = shippingSettings?.label || "Insured Shipping Across India";
  const totalPayablePaise = pricePaise + activeShippingPaise;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg("Please provide your full name, email address and contact phone number.");
      return;
    }

    if (!streetAddress.trim() || !city.trim() || !pincode.trim()) {
      setErrorMsg("Please provide complete delivery address with PIN code.");
      return;
    }

    setLoading(true);
    try {
      const fullAddress = `${streetAddress.trim()}, ${city.trim()}, ${stateName.trim()} - ${pincode.trim()}`;

      // Formatted customization object
      const customization = isOrnament
        ? null
        : {
            custom_type: isCustom ? "custom_fit" : "standard",
            standard_size: size,
            bust_inches: bust || undefined,
            waist_inches: waist || undefined,
            hips_inches: hips || undefined,
            shoulder_inches: shoulder || undefined,
            length_inches: length || undefined,
            custom_notes: customNotes || undefined,
          };

      const formattedNotesParts: string[] = [];
      if (isCustom) {
        formattedNotesParts.push(
          `[Custom Sizing: Bust ${bust || "N/A"}", Waist ${waist || "N/A"}", Hips ${hips || "N/A"}", Shoulder ${shoulder || "N/A"}", Length ${length || "N/A"}"]`
        );
      } else {
        formattedNotesParts.push(`[Size: ${size}]`);
      }
      if (customNotes) formattedNotesParts.push(`Customization: ${customNotes}`);
      if (deliveryNotes) formattedNotesParts.push(`Delivery Note: ${deliveryNotes}`);

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          start_date: new Date().toISOString().split("T")[0],
          duration_days: 1,
          size: isCustom ? "Custom Fit" : size,
          color,
          name: customerName,
          email: email.trim(),
          phone,
          address: fullAddress,
          notes: formattedNotesParts.join(" | "),
          workflow: "payment",
          customization,
          order_type: isOrnament ? "ornament" : "dress",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize order.");
      }

      // Direct to Razorpay payment checkout
      router.push(`/checkout/${data.reference}${data.access_token ? `?t=${data.access_token}` : ""}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Order could not be processed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left Form: Delivery & Customization Review */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Shipping Address Card */}
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8DDD1]">
            <Truck className="w-5 h-5 text-[#B06F5E]" />
            <h2 className="font-serif text-xl text-[#2B211C] font-normal">
              1. Delivery / Shipping Address
            </h2>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Email Address * (order updates are sent here)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Recipient Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Bride or Recipient name"
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

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Flat / House No., Apartment &amp; Street Address *
            </label>
            <input
              type="text"
              required
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="e.g. 402, Royal Palms, MG Road"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai / Kochi"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                State
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Kerala"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
                Postal PIN Code *
              </label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="6-digit PIN code"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1">
              Delivery Notes / Landmark (Optional)
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Near St. Mary Church, Gate 2"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>
        </div>

        {/* Customization Details for Dress Items */}
        {!isOrnament && (
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD1]">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#B06F5E]" />
                <h2 className="font-serif text-xl text-[#2B211C] font-normal">
                  2. Dress Customization &amp; Fit
                </h2>
              </div>
              <span className="text-[11px] font-sans text-[#B06F5E] bg-[#FAF6F0] px-2 py-0.5 rounded-xs border border-[#E8DDD1]">
                {isCustom ? "Custom Fit" : `Standard Size: ${size}`}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-[#2B211C] cursor-pointer">
                <input
                  type="radio"
                  name="custom_choice"
                  checked={!isCustom}
                  onChange={() => setIsCustom(false)}
                  className="accent-[#B06F5E]"
                />
                <span>Standard Size ({size})</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#2B211C] cursor-pointer">
                <input
                  type="radio"
                  name="custom_choice"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                  className="accent-[#B06F5E]"
                />
                <span className="font-medium text-[#B06F5E]">
                  Custom Measurements
                </span>
              </label>
            </div>

            {isCustom && (
              <div className="p-4 bg-[#FAF6F0]/60 border border-[#E8DDD1] rounded-sm space-y-3">
                <p className="text-[11px] text-[#7A6A5F]">
                  Enter measurements in inches below. Our master craftsmen will stitch this bridal piece precisely for you.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#7A6A5F] mb-1">Bust (in)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 34"
                      value={bust}
                      onChange={(e) => setBust(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#7A6A5F] mb-1">Waist (in)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 28"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#7A6A5F] mb-1">Hips (in)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 38"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#7A6A5F] mb-1">Shoulder (in)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 14"
                      value={shoulder}
                      onChange={(e) => setShoulder(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#7A6A5F] mb-1">Length (in)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 42"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#7A6A5F] mb-1">
                    Special Tailoring Notes (Neckline, Sleeves, Margins)
                  </label>
                  <textarea
                    rows={2}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Sweetheart neck, elbow-length sleeves, extra margin."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD1] rounded-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Right Column: Order Summary & Pay Action */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-6 sticky top-24">
          <h2 className="font-serif text-xl text-[#2B211C] font-normal pb-3 border-b border-[#E8DDD1]">
            Order Summary
          </h2>

          {/* Product Thumbnail & Details */}
          <div className="flex gap-4 items-start">
            <div className="relative aspect-[3/4] w-20 rounded-xs overflow-hidden bg-[#F4ECE1] border border-[#E8DDD1] shrink-0">
              {primaryImage?.url ? (
                <Image
                  src={primaryImage.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-[#7A6A5F]">
                  Haya
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#B06F5E] block">
                {isOrnament ? "Fine Ornament" : "Bridal Couture"}
              </span>
              <h3 className="font-serif text-base text-[#2B211C] font-normal truncate mt-0.5">
                {product.name}
              </h3>
              <p className="text-xs text-[#7A6A5F] mt-1">
                Size: <strong className="text-[#2B211C]">{isCustom ? "Custom Fit" : size}</strong>
                {color && <> • Color: <strong className="text-[#2B211C]">{color}</strong></>}
              </p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 pt-4 border-t border-[#E8DDD1] text-xs">
            <div className="flex justify-between text-[#7A6A5F]">
              <span>Product Price</span>
              <span className="font-medium text-[#2B211C]">{formatINR(pricePaise)}</span>
            </div>
            {!isOrnament && isCustom && (
              <div className="flex justify-between text-[#7A6A5F]">
                <span>Custom Tailoring / Stitching</span>
                <span className="font-medium text-emerald-700">Complimentary (₹0)</span>
              </div>
            )}
            <div className="flex justify-between text-[#7A6A5F]">
              <span>{shippingLabelText}</span>
              <span className="font-medium text-[#2B211C]">
                {formatINR(activeShippingPaise)}
              </span>
            </div>

            <div className="pt-3 border-t border-[#E8DDD1] flex justify-between items-baseline">
              <span className="font-serif text-base text-[#2B211C]">Total Payable</span>
              <span className="font-sans text-2xl font-semibold text-[#B06F5E]">
                {formatINR(totalPayablePaise)}
              </span>
            </div>
          </div>

          {/* Payment Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wider uppercase rounded-sm transition-all shadow-sm hover:shadow text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Pay {formatINR(totalPayablePaise)}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="space-y-2 text-[11px] text-[#7A6A5F] pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Verified Secure 256-Bit SSL Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#B06F5E] shrink-0" />
              <span>Insured delivery with real-time shipment updates</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
