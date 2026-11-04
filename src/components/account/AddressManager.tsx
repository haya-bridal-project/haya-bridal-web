"use client";

import { useState } from "react";
import { MapPin, Check, Edit2, AlertCircle } from "lucide-react";
import type { SavedAddress } from "@/lib/customer";

interface AddressManagerProps {
  initialAddress: SavedAddress;
  fullName?: string;
  phone?: string;
}

export function AddressManager({
  initialAddress,
  fullName = "",
  phone = "",
}: AddressManagerProps) {
  const [address, setAddress] = useState<SavedAddress>(initialAddress);
  const [isEditing, setIsEditing] = useState(
    !initialAddress.line1 && !initialAddress.city
  );

  const [line1, setLine1] = useState(initialAddress.line1);
  const [city, setCity] = useState(initialAddress.city);
  const [stateName, setStateName] = useState(initialAddress.state);
  const [pincode, setPincode] = useState(initialAddress.pincode);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch("/api/account/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line1,
          city,
          state: stateName,
          pincode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update address.");
      }

      setAddress({
        line1: line1.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving address.");
    } finally {
      setSaving(false);
    }
  };

  const hasAddress = Boolean(address.line1 || address.city);

  return (
    <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1] mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#F4ECE1] text-[#B06F5E] flex items-center justify-center">
            <MapPin className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#2B211C] font-normal">
              Saved Delivery Address
            </h2>
            <p className="text-xs text-[#7A6A5F] font-sans">
              Used to automatically prefill your doorstep delivery and express courier shipping.
            </p>
          </div>
        </div>

        {hasAddress && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[#B06F5E] hover:underline font-medium font-sans"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Address</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Your delivery address has been saved successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
              Flat / House No., Apartment &amp; Street Address *
            </label>
            <input
              type="text"
              required
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="e.g. 402, Royal Palms, MG Road"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
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
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                State
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Kerala / Maharashtra"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                PIN Code *
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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {saving ? "Saving Address..." : "Save Delivery Address"}
            </button>
            {hasAddress && (
              <button
                type="button"
                onClick={() => {
                  setLine1(address.line1);
                  setCity(address.city);
                  setStateName(address.state);
                  setPincode(address.pincode);
                  setIsEditing(false);
                }}
                className="px-4 py-2.5 bg-white border border-[#E8DDD1] text-[#7A6A5F] hover:text-[#2B211C] text-xs font-medium rounded-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : hasAddress ? (
        <div className="bg-[#FAF6F0] border border-[#E8DDD1] rounded-sm p-4 text-xs space-y-1">
          <p className="font-medium text-[#2B211C] text-sm">{fullName || "Default Recipient"}</p>
          <p className="text-[#7A6A5F]">{address.line1}</p>
          <p className="text-[#7A6A5F]">
            {address.city}
            {address.state ? `, ${address.state}` : ""} - {address.pincode}
          </p>
          {phone && <p className="text-[#7A6A5F] pt-1">Phone: {phone}</p>}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-[#7A6A5F]">
          <p className="mb-3">You have not saved a delivery address yet.</p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex px-4 py-2 bg-[#B06F5E] text-white rounded-sm text-xs font-medium uppercase tracking-wider"
          >
            Add Address
          </button>
        </div>
      )}
    </div>
  );
}

