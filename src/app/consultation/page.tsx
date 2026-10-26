"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export default function ConsultationPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_date: "",
    preferred_time: "Morning (11:00 AM – 1:00 PM)",
    mode: "in_store",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book consultation.");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Submission error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C]">Home</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Book Consultation</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
            Private Concierge
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2B211C] font-normal tracking-tight mt-1 mb-3">
            Book a Personal Bridal Consultation
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5F] leading-relaxed font-light">
            Meet with our lead bridal stylists for a private trial session. Explore silhouette drape, jewelry pairing, and custom measurements for your celebration.
          </p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 sm:p-10 shadow-xs">
          {success ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2B211C]">
                Consultation Request Received
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6A5F] max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{form.name}</strong>. Our bridal concierge team has received your appointment request for <strong>{form.preferred_date}</strong> and will confirm your time slot shortly.
              </p>
              <div className="pt-4">
                <Link
                  href="/collections"
                  className="inline-flex px-6 py-3 bg-[#B06F5E] text-white text-xs font-medium tracking-wide uppercase rounded-sm"
                >
                  Explore Bridal Vault
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Bride or Groom Name"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={form.preferred_date}
                    onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                    Preferred Time Slot
                  </label>
                  <select
                    value={form.preferred_time}
                    onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  >
                    <option value="Morning (11:00 AM – 1:00 PM)">Morning (11:00 AM – 1:00 PM)</option>
                    <option value="Afternoon (2:00 PM – 4:00 PM)">Afternoon (2:00 PM – 4:00 PM)</option>
                    <option value="Evening (5:00 PM – 7:30 PM)">Evening (5:00 PM – 7:30 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-2 font-sans">
                  Consultation Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "in_store", label: "In-Studio Trial", desc: "Private styling room & trial with master tailor" },
                    { id: "video", label: "Virtual Styling Call", desc: "Live video walkthrough of fabrics and outfits" },
                    { id: "phone", label: "Phone Consultation", desc: "Quick guidance on sizing, dates, and logistics" },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`p-3.5 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                        form.mode === m.id
                          ? "bg-[#FAF6F0] border-[#B06F5E] ring-1 ring-[#B06F5E]"
                          : "bg-white border-[#E8DDD1] hover:border-[#D4C3B2]"
                      }`}
                    >
                      <div>
                        <input
                          type="radio"
                          name="mode"
                          value={m.id}
                          checked={form.mode === m.id}
                          onChange={(e) => setForm({ ...form, mode: e.target.value })}
                          className="sr-only"
                        />
                        <span className="font-serif text-sm text-[#2B211C] block font-medium">
                          {m.label}
                        </span>
                        <span className="text-[11px] text-[#7A6A5F] mt-1 block">
                          {m.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                  Tell Us About Your Wedding / Event
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Mention wedding dates, preferred color tones (e.g. Ivory, Dusty Rose, Heritage Red), lehenga vs gown, or specific outfits you wish to try..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? "Submitting Request..." : "Request Private Consultation"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
