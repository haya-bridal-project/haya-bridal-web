"use client";

import { useState } from "react";
import {
  Settings,
  CreditCard,
  MapPin,
  CheckCircle2,
  Truck,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { formatINR } from "@/lib/money";

interface SettingsMap {
  shipping?: { fee_paise?: number; label?: string; estimated_days?: string };
  booking_workflow?: { mode?: string };
  contact?: { email?: string; phone?: string; whatsapp?: string; address?: string; hours?: string };
  contact_info?: { email?: string; phone?: string; whatsapp?: string; address?: string; hours?: string };
  [key: string]: unknown;
}

interface SettingsEditorProps {
  initialSettings: SettingsMap;
}

export function SettingsEditor({ initialSettings = {} }: SettingsEditorProps) {
  // Shipping Charges Settings
  const initialShipping = initialSettings.shipping || {};
  const [shippingFee, setShippingFee] = useState<string>(
    initialShipping.fee_paise !== undefined
      ? (Number(initialShipping.fee_paise) / 100).toString()
      : "0"
  );
  const [shippingLabel, setShippingLabel] = useState<string>(
    initialShipping.label || "Insured Shipping Across India"
  );
  const [estimatedDays, setEstimatedDays] = useState<string>(
    initialShipping.estimated_days || "3-5 Business Days"
  );

  // Workflow Mode
  const [workflow, setWorkflow] = useState<string>(
    initialSettings.booking_workflow?.mode || "payment"
  );

  // Contact Info
  const [supportEmail, setSupportEmail] = useState<string>(
    initialSettings.contact?.email || initialSettings.contact_info?.email || "concierge@hayabridal.com"
  );
  const [supportPhone, setSupportPhone] = useState<string>(
    initialSettings.contact?.phone || initialSettings.contact_info?.phone || "+91 98765 43210"
  );
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    initialSettings.contact?.whatsapp ||
      initialSettings.contact_info?.whatsapp ||
      initialSettings.contact?.phone ||
      initialSettings.contact_info?.phone ||
      "+91 98765 43210"
  );
  const [boutiqueAddress, setBoutiqueAddress] = useState<string>(
    initialSettings.contact?.address ||
      initialSettings.contact_info?.address ||
      "Plot No. 42, Avenue Montaigne Enclave, Jubilee Hills, Hyderabad, Telangana 500033"
  );
  const [boutiqueHours, setBoutiqueHours] = useState<string>(
    initialSettings.contact?.hours ||
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
      const feeNum = Math.max(0, Number(shippingFee) || 0);

      const payload = {
        shipping: {
          fee_paise: Math.round(feeNum * 100),
          label: shippingLabel.trim() || "Insured Shipping Across India",
          estimated_days: estimatedDays.trim() || "3-5 Business Days",
        },
        booking_workflow: { mode: workflow },
        contact: {
          email: supportEmail.trim(),
          phone: supportPhone.trim(),
          whatsapp: whatsappNumber.trim(),
          address: boutiqueAddress.trim(),
          hours: boutiqueHours.trim(),
        },
        contact_info: {
          email: supportEmail.trim(),
          phone: supportPhone.trim(),
          whatsapp: whatsappNumber.trim(),
          address: boutiqueAddress.trim(),
          hours: boutiqueHours.trim(),
        },
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to persist boutique settings");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const parsedFee = Math.max(0, Number(shippingFee) || 0);

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E8DDD1] gap-4">
        <div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#B06F5E]">
            Store Configuration
          </span>
          <h1 className="font-serif text-3xl text-[#2B211C] font-normal tracking-tight mt-1">
            Settings &amp; Pricing
          </h1>
          <p className="text-xs text-[#7A6A5F] mt-1">
            Manage store shipping charges, zero-tax policy, and concierge contact details.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Settings & Pricing"}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-2 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Settings saved successfully. The updated shipping rates and boutique policies are now active across the storefront.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. SHIPPING & DELIVERY CHARGES */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-[#E8DDD1]">
          <div className="p-2 rounded-xs bg-[#FAF6F0] text-[#B06F5E] border border-[#E8DDD1]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Shipping &amp; Delivery Charges
            </h2>
            <p className="text-xs text-[#7A6A5F] mt-0.5">
              Set standard shipping costs charged to customers during checkout on both bridal dresses and fine ornaments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Standard Shipping Charge */}
          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Standard Shipping Charge (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#7A6A5F]">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                placeholder="0"
                className="w-full text-xs pl-7 pr-3 py-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0] text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
              />
            </div>
            <span className="text-[11px] text-[#7A6A5F] block mt-1">
              Standard delivery charge added to orders during checkout.
            </span>
          </div>

          {/* Shipping Label Name */}
          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Checkout Shipping Label
            </label>
            <input
              type="text"
              value={shippingLabel}
              onChange={(e) => setShippingLabel(e.target.value)}
              placeholder="Insured Shipping Across India"
              className="w-full text-xs px-3 py-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0] text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
            <span className="text-[11px] text-[#7A6A5F] block mt-1">
              Text shown on the order summary breakdown.
            </span>
          </div>

          {/* Estimated Delivery Window */}
          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Estimated Delivery Window
            </label>
            <input
              type="text"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="3-5 Business Days"
              className="w-full text-xs px-3 py-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0] text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
            <span className="text-[11px] text-[#7A6A5F] block mt-1">
              Displayed to customers on product pages and shipping information.
            </span>
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] space-y-2 text-xs">
          <span className="font-semibold text-[#2B211C] block">
            Customer Checkout Preview:
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#7A6A5F] gap-2 pt-1 border-t border-[#E8DDD1]">
            <div>
              <span>Display Method: </span>
              <strong className="text-[#2B211C]">{shippingLabel || "Insured Shipping"}</strong>
            </div>
            <div>
              <span>Rate Applied: </span>
              <strong className="text-[#B06F5E]">
                {`Flat ₹${parsedFee}`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ZERO TAX & GST POLICY CARD */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Zero GST &amp; Tax Policy
            </h2>
            <p className="text-xs text-[#7A6A5F] mt-0.5">
              GST has been completely deactivated across all products in this boutique.
            </p>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xs text-xs text-[#7A6A5F] space-y-1.5 leading-relaxed">
          <p className="font-medium text-[#2B211C]">
            • No GST or additional sales tax is charged or added at checkout.
          </p>
          <p>
            • Product prices reflect the complete net purchase amount. Only the configured shipping charge (if any) is added to the order total.
          </p>
          <p>
            • Invoices, order summaries, and payment transactions will reflect 0% GST with zero tax line items.
          </p>
        </div>
      </div>

      {/* 3. ORDER WORKFLOW MODE */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-[#B06F5E]" />
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Order &amp; Checkout Workflow Mode
            </h2>
            <p className="text-xs text-[#7A6A5F]">
              Control whether brides pay online directly upon checkout or submit order requests for concierge verification.
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
                  Direct Online Payment
                </span>
                <span className="text-[11px] text-[#7A6A5F] block mt-1 leading-relaxed">
                  Customers pay total (product price + shipping fee) online immediately. Orders are automatically marked as confirmed upon successful transaction.
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs self-start">
              Automated Standard
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
                  Concierge Review First
                </span>
                <span className="text-[11px] text-[#7A6A5F] block mt-1 leading-relaxed">
                  Customers submit orders with customization measurements. Boutique team reviews details and dispatches a payment link manually.
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs self-start">
              High-Touch Bespoke
            </span>
          </label>
        </div>
      </div>

      {/* 4. BOUTIQUE CONTACT & CONCIERGE INFORMATION */}
      <div className="bg-white border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#B06F5E]" />
          <div>
            <h2 className="font-serif text-lg text-[#2B211C]">
              Flagship Boutique &amp; Concierge Details
            </h2>
            <p className="text-xs text-[#7A6A5F]">
              Displayed on client order confirmations, website footer, and email receipts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Official Boutique Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0] text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Concierge Calling Phone
            </label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0] text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>

          <div className="md:col-span-2 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-sm space-y-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <label className="text-xs font-semibold text-[#2B211C] block">
                Boutique WhatsApp Number for Customer Dress Orders *
              </label>
            </div>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-2.5 border border-emerald-300 rounded-sm bg-white text-[#2B211C] focus:outline-none focus:border-emerald-600 font-medium"
            />
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Customer bridal dress customization requests and order tickets will automatically be sent to this WhatsApp number. Include country code (e.g. <code>+91 98765 43210</code>).
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-[#2B211C] block mb-1">
              Flagship Boutique Address
            </label>
            <input
              type="text"
              value={boutiqueAddress}
              onChange={(e) => setBoutiqueAddress(e.target.value)}
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0] text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
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
              className="w-full text-xs p-2.5 border border-[#E8DDD1] rounded-sm bg-[#FAF6F0] text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
            />
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium rounded-sm shadow-xs transition-colors disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Settings & Pricing"}
        </button>
      </div>
    </form>
  );
}
