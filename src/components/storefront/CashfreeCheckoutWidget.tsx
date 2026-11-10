"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  AlertCircle,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import type { CashfreeMode } from "@/lib/cashfree";
import type { Booking } from "@/lib/types";

interface CashfreeCheckoutWidgetProps {
  booking: Booking;
  cashfreeReady: boolean;
  cashfreeMode: CashfreeMode;
  accessToken?: string | null;
  initialOrderId?: string | null;
}

type CashfreeCheckoutResult = {
  error?: { message?: string; code?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

interface CashfreeSdkInstance {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget?: "_modal" | "_self" | "_blank" | "_top";
  }) => Promise<CashfreeCheckoutResult>;
}

declare global {
  interface Window {
    Cashfree?: (config: { mode: CashfreeMode }) => CashfreeSdkInstance;
  }
}

export function CashfreeCheckoutWidget({
  booking,
  cashfreeReady,
  cashfreeMode,
  accessToken,
  initialOrderId,
}: CashfreeCheckoutWidgetProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [verifyingReturn, setVerifyingReturn] = useState(Boolean(initialOrderId));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handledReturnRef = useRef(false);

  const verifyOrder = useCallback(
    async (orderId: string) => {
      const verifyRes = await fetch("/api/cashfree/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          order_id: orderId,
          access_token: accessToken ?? undefined,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Payment verification failed.");
      }
      router.push(
        `/booking/confirmation/${booking.reference}${accessToken ? `?t=${encodeURIComponent(accessToken)}` : ""}`
      );
    },
    [accessToken, booking.id, booking.reference, router]
  );

  // If Cashfree redirected back to return_url with ?cf_order_id=..., verify immediately
  useEffect(() => {
    if (!initialOrderId || !cashfreeReady || handledReturnRef.current) return;
    handledReturnRef.current = true;

    let cancelled = false;
    (async () => {
      setVerifyingReturn(true);
      setErrorMsg(null);
      try {
        await verifyOrder(initialOrderId);
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "Payment could not be verified. Please retry below."
          );
          setVerifyingReturn(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cashfreeReady, initialOrderId, verifyOrder]);

  const handlePayNow = async () => {
    if (!cashfreeReady || loading || verifyingReturn) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      if (!window.Cashfree) {
        throw new Error("Cashfree payment SDK is still loading. Please retry in a moment.");
      }

      // 1. Create order & payment_session_id on server
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          access_token: accessToken ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.payment_session_id) {
        throw new Error(data.error || "Failed to initialize Cashfree payment gateway.");
      }

      // 2. Launch Cashfree Checkout JS v3 Modal
      const cashfree = window.Cashfree({ mode: cashfreeMode });
      const result = await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
      });

      if (result?.redirect) {
        return;
      }

      if (result?.error) {
        const message = result.error.message || "Payment was cancelled or declined.";
        try {
          await fetch("/api/cashfree/failed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              booking_id: booking.id,
              access_token: accessToken ?? undefined,
              order_id: data.order_id,
              error_code: result.error.code || "CASHFREE_CHECKOUT_ERROR",
              error_description: message,
            }),
          });
        } catch {
          // Non-fatal failure telemetry
        }
        setErrorMsg(message);
        setLoading(false);
        return;
      }

      // 3. Verify authoritative order status on backend
      await verifyOrder(data.order_id);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Could not launch payment checkout.");
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Payment Action Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif text-2xl text-[#2B211C] font-normal pb-4 border-b border-[#E8DDD1]">
              Online Payment
            </h2>

            {cashfreeReady ? (
              <div className="mt-6 space-y-6">
                <div className="p-4 bg-[#FAF6F0] rounded-xs border border-[#E8DDD1] flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#B06F5E] shrink-0" />
                  <div className="text-xs">
                    <span className="font-medium text-[#2B211C] block">
                      Secure Cashfree Payment Gateway
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
                  disabled={loading || verifyingReturn}
                  className="w-full py-4 px-6 bg-[#B06F5E] hover:bg-[#975D4E] text-white text-xs sm:text-sm font-medium tracking-wide uppercase rounded-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {verifyingReturn
                      ? "Verifying Payment..."
                      : loading
                        ? "Processing..."
                        : `Pay ${formatINR(booking.total_paise)}`}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-[#7A6A5F]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-bit Bank Grade Encrypted Payment</span>
                </div>
              </div>
            ) : (
              /* Informative state when Cashfree keys are not yet configured in .env.local */
              <div className="mt-6 space-y-5">
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-sm text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Cashfree Credentials Notice</span>
                  </div>
                  <p className="font-light leading-relaxed">
                    Cashfree credentials (<code className="bg-amber-100 px-1 py-0.5 rounded-xs">CASHFREE_APP_ID</code> &amp; <code className="bg-amber-100 px-1 py-0.5 rounded-xs">CASHFREE_SECRET_KEY</code>) must be configured in your environment to accept test or live payments.
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

