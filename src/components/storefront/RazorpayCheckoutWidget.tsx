"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  AlertCircle,
  Clock,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import type { Booking } from "@/lib/types";

interface RazorpayCheckoutWidgetProps {
  booking: Booking;
  razorpayReady: boolean;
  razorpayKeyId: string;
}

declare global {
  interface Window {
    Razorpay?: unknown;
  }
}

export function RazorpayCheckoutWidget({
  booking,
  razorpayReady,
  razorpayKeyId,
}: RazorpayCheckoutWidgetProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const handlePayNow = async () => {
    if (!razorpayReady) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Create order on server
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize payment gateway.");
      }

      // 2. Open Razorpay Modal
      const options = {
        key: razorpayKeyId,
        amount: data.amount,
        currency: "INR",
        name: "Haya Premium Bridal Rental",
        description: `Rental: ${booking.product_name} (${booking.reference})`,
        order_id: data.order_id,
        prefill: {
          name: booking.customer_name,
          email: booking.customer_email,
          contact: booking.customer_phone,
        },
        theme: {
          color: "#B06F5E",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify signature strictly on server
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                booking_id: booking.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }
            router.push(`/booking/confirmation/${booking.reference}`);
          } catch (e: unknown) {
            setErrorMsg(e instanceof Error ? e.message : "Verification error.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window.Razorpay as any)(options);
      rzp.on("payment.failed", (response: { error: { description: string } }) => {
        setErrorMsg(response.error.description || "Payment attempt failed.");
        setLoading(false);
      });
      rzp.open();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Unable to launch checkout.");
      setLoading(false);
    }
  };

  const handleConvertToRequest = async () => {
    setConverting(true);
    try {
      const res = await fetch("/api/bookings/convert-to-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });
      if (res.ok) {
        router.push(`/booking/confirmation/${booking.reference}`);
      } else {
        router.push(`/account/bookings`);
      }
    } catch {
      router.push(`/account/bookings`);
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Payment Action Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif text-2xl text-[#2B211C] font-normal pb-4 border-b border-[#E8DDD1]">
              Payment Details
            </h2>

            {razorpayReady ? (
              <div className="mt-6 space-y-6">
                <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#B06F5E] shrink-0" />
                  <div className="text-xs">
                    <span className="font-medium text-[#2B211C] block">
                      Razorpay Verified Payment Gateway
                    </span>
                    <span className="text-[#7A6A5F]">
                      Supports UPI, Credit/Debit Cards, NetBanking, and Net Banking.
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs sm:text-sm font-medium tracking-wide uppercase rounded-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {loading ? "Processing..." : `Pay ${formatINR(booking.total_paise)} via Razorpay`}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-[#7A6A5F]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-bit Bank Grade Encrypted Payment</span>
                </div>
              </div>
            ) : (
              /* Informative state when Razorpay keys are not yet configured in .env.local */
              <div className="mt-6 space-y-5">
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-sm text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Payment Gateway Setup Notice</span>
                  </div>
                  <p className="font-light leading-relaxed">
                    Online Razorpay test/live credentials (<code className="bg-amber-100 px-1 py-0.5 rounded-xs">RAZORPAY_KEY_ID</code> &amp; <code className="bg-amber-100 px-1 py-0.5 rounded-xs">RAZORPAY_KEY_SECRET</code>) have not been supplied in the environment. Per instructions, payment is not faked or simulated.
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-[#7A6A5F] mb-4">
                    You can submit this reservation hold directly as a <strong>Booking Request</strong>. Our concierge will verify outfit availability and provide direct payment instructions.
                  </p>

                  <button
                    type="button"
                    onClick={handleConvertToRequest}
                    disabled={converting}
                    className="w-full py-3.5 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs font-medium tracking-wide uppercase rounded-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{converting ? "Submitting..." : "Submit as Booking Request (Pay at Studio)"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Booking Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs">
            <h3 className="font-serif text-lg text-[#2B211C] font-normal pb-3 border-b border-[#E8DDD1]">
              Order Summary
            </h3>

            <div className="py-4 space-y-3 text-xs border-b border-[#E8DDD1]">
              <div className="flex justify-between">
                <span className="text-[#7A6A5F]">Booking Ref:</span>
                <span className="font-mono font-medium text-[#2B211C]">{booking.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5F]">Outfit:</span>
                <span className="font-serif text-sm text-[#2B211C]">{booking.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5F]">Dates:</span>
                <span className="text-[#2B211C] font-sans">
                  {formatDate(booking.start_date)} &rarr; {formatDate(booking.end_date)}
                </span>
              </div>
              {booking.size && (
                <div className="flex justify-between">
                  <span className="text-[#7A6A5F]">Size:</span>
                  <span className="text-[#2B211C]">{booking.size}</span>
                </div>
              )}
            </div>

            <div className="py-4 space-y-2 text-xs text-[#7A6A5F] border-b border-[#E8DDD1]">
              <div className="flex justify-between">
                <span>Rental Charge</span>
                <span className="text-[#2B211C] font-medium font-sans">
                  {formatINR(booking.rental_amount_paise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit (Refundable)</span>
                <span className="text-[#2B211C] font-medium font-sans">
                  {formatINR(booking.deposit_paise)}
                </span>
              </div>
              {booking.fees_paise > 0 && (
                <div className="flex justify-between">
                  <span>Fitting & Service Fee</span>
                  <span className="text-[#2B211C] font-medium font-sans">
                    {formatINR(booking.fees_paise)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-baseline justify-between text-base">
              <span className="font-serif text-[#2B211C]">Total Payable</span>
              <span className="font-sans font-bold text-xl text-[#B06F5E]">
                {formatINR(booking.total_paise)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
