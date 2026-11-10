"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export default function EnquiryPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Bespoke Bridal Dress Inquiry",
    size: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          kind: "contact",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit enquiry.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error submitting enquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Enquiry</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
            Client Assistance
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2B211C] font-normal tracking-tight mt-1 mb-3">
            Client Enquiry
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5F] font-light leading-relaxed">
            Have a question regarding our bridal dresses, handcrafted ornaments, bespoke tailoring measurements, or order status? Submit your enquiry below and our stylist concierge team will assist you.
          </p>
        </div>

        {/* Success Confirmation Card */}
        {success ? (
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 stroke-[1.6]" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2B211C] mb-2 font-normal">
              Enquiry Received
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6A5F] max-w-md mx-auto leading-relaxed mb-8">
              Thank you for reaching out to Haya Bridal. Our bridal concierge team has received your enquiry and will respond via email or WhatsApp promptly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/collections"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium uppercase tracking-wider rounded-sm transition-colors shadow-xs"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    subject: "Bespoke Bridal Dress Inquiry",
                    size: "",
                    message: "",
                  });
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-white border border-[#E8DDD1] hover:bg-[#FAF6F0] text-[#2B211C] text-xs font-medium rounded-sm transition-colors"
              >
                Submit Another Enquiry
              </button>
            </div>
          </div>
        ) : (
          /* Enquiry Form */
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 sm:p-10 shadow-xs max-w-2xl mx-auto">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-medium">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ayesha Khan"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-medium">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ayesha@example.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] transition-all"
                  />
                </div>
              </div>

              {/* Telephone & Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-medium">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-medium">
                    Inquiry Topic *
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] transition-all"
                  >
                    <option value="Bespoke Bridal Dress Inquiry">Bespoke Bridal Dress Inquiry</option>
                    <option value="Fine Bridal Ornaments Inquiry">Fine Bridal Ornaments Inquiry</option>
                    <option value="Custom Tailoring & Measurements Assistance">Custom Tailoring &amp; Measurements Assistance</option>
                    <option value="Order & Cashfree Payment Question">Order &amp; Cashfree Payment Question</option>
                    <option value="Delivery Timeline & Shipping Inquiry">Delivery Timeline &amp; Shipping Inquiry</option>
                    <option value="General Concierge Assistance">General Concierge Assistance</option>
                  </select>
                </div>
              </div>

              {/* Optional Sizing / Fit Choice */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-medium">
                  Requested Size / Fit Choice (Optional)
                </label>
                <input
                  type="text"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="e.g. Custom Fit or Size M"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] transition-all"
                />
              </div>

              {/* Detailed Message */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-medium">
                  Your Message &amp; Questions *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about the outfit or ornaments you are interested in, color choices, tailoring preferences, or any specific questions..."
                  className="w-full p-3.5 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E] focus:ring-1 focus:ring-[#B06F5E] transition-all leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium uppercase tracking-wider rounded-sm transition-all shadow-xs hover:shadow disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Submitting Enquiry..." : "Submit Enquiry"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

