"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  CreditCard,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface SettingsEditorProps {
  initialSettings: Record<string, any>;
}

export function SettingsEditor({ initialSettings = {} }: SettingsEditorProps) {
  const [workflow, setWorkflow] = useState<string>(
    initialSettings.booking_workflow?.mode || "payment"
  );
  const [bufferDays, setBufferDays] = useState<number>(
    initialSettings.rental_rules?.turnaround_buffer_days ?? 2
  );
  const [minLeadDays, setMinLeadDays] = useState<number>(
    initialSettings.rental_rules?.min_lead_time_days ?? 3
  );
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(
    initialSettings.rental_rules?.max_advance_days ?? 180
  );
  const [supportEmail, setSupportEmail] = useState<string>(
    initialSettings.contact_info?.email || "concierge@hayabridal.com"
  );
  const [supportPhone, setSupportPhone] = useState<string>(
    initialSettings.contact_info?.phone || "+91 98765 43210"
  );
  const [boutiqueAddress, setBoutiqueAddress] = useState<string>(
    initialSettings.contact_info?.address ||
      "Plot No. 42, Avenue Montaigne Enclave, Jubilee Hills, Hyderabad, Telangana 500033"
  );
  const [boutiqueHours, setBoutiqueHours] = useState<string>(
    initialSettings.contact_info?.hours ||
      "Tuesday to Sunday: 11:00 AM – 8:00 PM (Monday by Private Appointment Only)"
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSavedSuccess(false);

    try {
      const payload = {
        booking_workflow: { mode: workflow },
        rental_rules: {
          turnaround_buffer_days: Number(bufferDays),
          min_lead_time_days: Number(minLeadDays),
          max_advance_days: Number(maxAdvanceDays),
        },
        contact_info: {
          email: supportEmail,
          phone: supportPhone,
          address: boutiqueAddress,
          hours: boutiqueHours,
        },
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to persist settings");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Store Configuration
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Rental Rules &amp; Boutique Policies
          </h1>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Configuration"}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-2 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Configuration updated successfully. New rental rules are now active across the storefront.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Booking Checkout Workflow */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-[#B06F5E]" />
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Booking Workflow Mode
            </h2>
            <p className="text-xs text-[#7A6A5F]">
              Control whether brides complete payment online directly or submit reservation requests for concierge review.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <label
            className={`border rounded-sm p-4 cursor-pointer flex flex-col justify-between gap-3 transition-colors ${
              workflow === "payment"
                ? "border-[#B06F5E] bg-[#FAF6F0]"
                : "border-[#E8DDD1] hover:bg-[#FFFDF9]"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="workflow"
                value="payment"
                checked={workflow === "payment"}
                onChange={() => setWorkflow("payment")}
                className="mt-1 text-[#B06F5E] focus:ring-[#B06F5E]"
              />
              <div>
                <span className="text-xs font-semibold text-[#2B211C] block">
                  Direct Online Payment (Razorpay)
                </span>
                <span className="text-[11px] text-[#7A6A5F] block mt-1 leading-relaxed">
                  Brides pay rental fee &amp; refundable security deposit online immediately. The reservation is automatically locked and confirmed upon successful transaction.
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs self-start">
              Automated Pipeline
            </span>
          </label>

          <label
            className={`border rounded-sm p-4 cursor-pointer flex flex-col justify-between gap-3 transition-colors ${
              workflow === "request"
                ? "border-[#B06F5E] bg-[#FAF6F0]"
                : "border-[#E8DDD1] hover:bg-[#FFFDF9]"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="workflow"
                value="request"
                checked={workflow === "request"}
                onChange={() => setWorkflow("request")}
                className="mt-1 text-[#B06F5E] focus:ring-[#B06F5E]"
              />
              <div>
                <span className="text-xs font-semibold text-[#2B211C] block">
                  Concierge Review &amp; Approval First
                </span>
                <span className="text-[11px] text-[#7A6A5F] block mt-1 leading-relaxed">
                  Brides submit booking dates with contact info. Staff reviews bridal measurements, event timeline, and sends custom payment link manually.
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs self-start">
              High-Touch Bespoke
            </span>
          </label>
        </div>
      </div>

      {/* Date Scheduling & Overlap Protection */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-[#B06F5E]" />
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Inventory Availability &amp; Cleaning Turnaround Rules
            </h2>
            <p className="text-xs text-[#7A6A5F]">
              Parameters enforced during calendar slot selection and real-time database reservation checks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Turnaround Buffer (Days)
            </label>
            <input
              type="number"
              min={0}
              max={14}
              value={bufferDays}
              onChange={(e) => setBufferDays(Number(e.target.value))}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0]"
            />
            <span className="text-[10px] text-[#7A6A5F] block mt-1">
              Required quarantine days after return for couture dry cleaning &amp; hand inspection.
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Minimum Lead Time (Days)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={minLeadDays}
              onChange={(e) => setMinLeadDays(Number(e.target.value))}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0]"
            />
            <span className="text-[10px] text-[#7A6A5F] block mt-1">
              Days ahead of event start date required to prepare and dispatch the garment.
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Max Advance Booking (Days)
            </label>
            <input
              type="number"
              min={30}
              max={365}
              value={maxAdvanceDays}
              onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0]"
            />
            <span className="text-[10px] text-[#7A6A5F] block mt-1">
              Farthest window in advance brides can reserve outfits (typically 180 days).
            </span>
          </div>
        </div>
      </div>

      {/* Boutique Contact & Concierge Information */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#B06F5E]" />
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Flagship Boutique &amp; Concierge Details
            </h2>
            <p className="text-xs text-[#7A6A5F]">
              Displayed in website footer, booking confirmations, and transactional emails.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Concierge Phone / WhatsApp
            </label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Boutique Address
            </label>
            <input
              type="text"
              value={boutiqueAddress}
              onChange={(e) => setBoutiqueAddress(e.target.value)}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Operating Hours &amp; Visiting Policy
            </label>
            <input
              type="text"
              value={boutiqueHours}
              onChange={(e) => setBoutiqueHours(e.target.value)}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm shadow-xs transition-colors disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
