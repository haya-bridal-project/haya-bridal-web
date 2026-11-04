"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  AlertCircle,
  Truck,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import type { Booking } from "@/lib/types";

interface RazorpayCheckoutWidgetProps {
  booking: Booking;
  razorpayReady: boolean;
  razorpayKeyId: string;
  accessToken?: string | null;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function RazorpayCheckoutWidget({
  booking,
  razorpayReady,
  razorpayKeyId,
  accessToken,
}: RazorpayCheckoutWidgetProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePayNow = async () => {
    if (!razorpayReady) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Create order on server
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id, access_token: accessToken ?? undefined }),
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
        name: "Haya Bridal",
        description: `Order: ${booking.product_name} (${booking.reference})`,
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
                access_token: accessToken ?? undefined,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }
            router.push(`/booking/confirmation/${booking.reference}${accessToken ? `?t=${accessToken}` : ""}`);
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

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async (response: any) => {
        const err = response?.error || {};
        setErrorMsg(err.description || "Payment failed or declined at gateway.");
        setLoading(false);

        // Report failure to server so admin has immediate visibility
        try {
          await fetch("/api/razorpay/failed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              booking_id: booking.id,
              access_token: accessToken ?? undefined,
              razorpay_order_id: err.metadata?.order_id || data.order_id,
              razorpay_payment_id: err.metadata?.payment_id || null,
              error_code: err.code || "PAYMENT_FAILED",
              error_description: err.description || err.reason || "Payment declined or failed at gateway",
              error_source: err.source || "customer",
              error_step: err.step || "payment_authorization",
              error_reason: err.reason || "payment_failed",
            }),
          });
        } catch (reportErr) {
          console.error("[checkout] failed to report payment failure", reportErr);
        }
      });
      rzp.open();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Payment gateway error.");
      setLoading(false);
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
              Online Payment
            </h2>

            {razorpayReady ? (
              <div className="mt-6 space-y-6">
                <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#B06F5E] shrink-0" />
                  <div className="text-xs">
                    <span className="font-medium text-[#2B211C] block">
                      Secure Verified Payment Gateway
                    </span>
                    <span className="text-[#7A6A5F]">
                      Supports UPI (Google Pay, PhonePe, Paytm), Credit &amp; Debit Cards, NetBanking.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xs text-[11px] text-amber-900">
                  <strong>Notice:</strong> All orders must be prepaid online. Cash on Delivery (COD) is not available.
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
                  className="w-full py-4 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs sm:text-sm font-medium tracking-wide uppercase rounded-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {loading ? "Processing..." : `Pay ${formatINR(booking.total_paise)}`}
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
                    <span>Razorpay Credentials Notice</span>
                  </div>
                  <p className="font-light leading-relaxed">
                    Razorpay credentials (<code className="bg-amber-100 px-1 py-0.5 rounded-xs">RAZORPAY_KEY_ID</code> &amp; <code className="bg-amber-100 px-1 py-0.5 rounded-xs">RAZORPAY_KEY_SECRET</code>) must be configured in your environment to accept live/test payments.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Order Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg text-[#2B211C] font-normal pb-3 border-b border-[#E8DDD1]">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs border-b border-[#E8DDD1] pb-4">
              <div className="flex justify-between">
                <span className="text-[#7A6A5F]">Order Ref:</span>
                <span className="font-mono font-medium text-[#B06F5E]">{booking.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5F]">Item:</span>
                <span className="font-serif text-sm text-[#2B211C]">{booking.product_name}</span>
              </div>
              {booking.size && (
                <div className="flex justify-between">
                  <span className="text-[#7A6A5F]">Fit / Size:</span>
                  <span className="font-medium text-[#2B211C]">{booking.size}</span>
                </div>
              )}
              {booking.color && (
                <div className="flex justify-between">
                  <span className="text-[#7A6A5F]">Color:</span>
                  <span className="text-[#2B211C]">{booking.color}</span>
                </div>
              )}
              {booking.customer_address && (
                <div className="pt-2 text-[11px] text-[#7A6A5F]">
                  <span className="font-medium text-[#2B211C] block mb-0.5">Shipping Address:</span>
                  <p>{booking.customer_address}</p>
                </div>
              )}
              {booking.notes && (
                <div className="pt-2 text-[11px] text-[#7A6A5F] bg-[#FAF6F0] p-2.5 rounded-xs border border-[#E8DDD1]">
                  <span className="font-medium text-[#2B211C] block mb-0.5">Customization / Notes:</span>
                  <p className="line-clamp-3">{booking.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-[#7A6A5F] border-b border-[#E8DDD1] pb-4">
              <div className="flex justify-between">
                <span>Product Price</span>
                <span className="text-[#2B211C] font-medium font-sans">
                  {formatINR(booking.rental_amount_paise || (booking.total_paise - (booking.fees_paise || 0)))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Insured Express Shipping</span>
                <span className="font-medium text-[#2B211C]">
                  {formatINR(booking.fees_paise || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between text-base">
              <span className="font-serif text-[#2B211C]">Total Payable</span>
              <span className="font-sans font-bold text-2xl text-[#B06F5E]">
                {formatINR(booking.total_paise)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
