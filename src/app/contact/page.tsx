"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
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
        body: JSON.stringify({ ...form, kind: "contact" }),
      });
      if (res.ok) setSuccess(true);
      else throw new Error("Failed to send message.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error sending message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C]">Home</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">Contact</span>
        </nav>

        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
            Get In Touch
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2B211C] font-normal tracking-tight mt-1 mb-3">
            Contact the Haya Concierge
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5F] font-light leading-relaxed">
            Have questions regarding fitting trials, bridal consultations, or rental timelines? Our concierge team is here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-8 shadow-xs space-y-6">
            <h3 className="font-serif text-xl text-[#2B211C] font-normal pb-4 border-b border-[#E8DDD1]">
              Bridal Studio & Concierge
            </h3>

            <div className="space-y-4 text-xs text-[#7A6A5F]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#B06F5E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#2B211C] block">Flagship Studio</span>
                  <p className="leading-relaxed">Haya Bridal Studio, Haute Couture Lane, Fashion Enclave, New Delhi / Mumbai</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#B06F5E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#2B211C] block">Telephone & WhatsApp</span>
                  <p>+91 (0) 98765 43210</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#B06F5E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#2B211C] block">Client Support</span>
                  <p>concierge@hayabridal.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#B06F5E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#2B211C] block">Studio Fitting Hours</span>
                  <p>Tuesday &ndash; Sunday: 11:00 AM &ndash; 7:30 PM (By Appointment)</p>
                  <p>Monday: Reserved for sanitization & catalog care</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-8 shadow-xs">
            {success ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-2xl text-[#2B211C]">Message Received</h3>
                <p className="text-xs text-[#7A6A5F] max-w-sm mx-auto">
                  Thank you for reaching out. A stylist will respond to your inquiry within 24 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-xl text-[#2B211C] font-normal pb-3 border-b border-[#E8DDD1]">
                  Send a Message
                </h3>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Wedding Outfit Inquiry"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7A6A5F] mb-1 font-sans">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How may we assist you with your wedding or celebration rental?"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DDD1] rounded-sm text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? "Sending Message..." : "Send Message"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
