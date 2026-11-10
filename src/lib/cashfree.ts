import crypto from "node:crypto";
import { env } from "@/lib/env";

const CASHFREE_API_VERSION = "2025-01-01";

export type CashfreeMode = "sandbox" | "production";

export type CashfreeOrder = {
  cf_order_id: string | number;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
  payment_session_id: string;
};

export type CashfreePayment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_group: string | null;
  payment_message?: string | null;
  error_details?: {
    error_code?: string;
    error_description?: string;
    error_reason?: string;
    error_source?: string;
  } | null;
};

function cashfreeBaseUrl(mode: CashfreeMode): string {
  return mode === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeRequestConfig() {
  const { appId, secretKey, mode } = env.cashfree();
  return {
    baseUrl: cashfreeBaseUrl(mode),
    mode,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secretKey,
    },
  };
}

/** Normalize phone strings into a valid 10-digit Indian or E.164 phone for Cashfree. */
export function formatCashfreePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10 && digits.length <= 15) return `+${digits}`;
  return "9999999999";
}

/** Sanitize IDs to Cashfree-allowed characters (`[a-zA-Z0-9_-]`, max 45 chars). */
export function sanitizeCashfreeId(raw: string, maxLen = 45): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "_");
  return cleaned.slice(0, maxLen) || `cf_${Date.now()}`;
}

/** Turn a failed Cashfree API response into a readable error message. */
function describeCashfreeFailure(status: number, body: string, fallback: string) {
  if (status === 401 || status === 403) {
    return "Cashfree authentication failed. Check CASHFREE_APP_ID, CASHFREE_SECRET_KEY, and CASHFREE_ENV.";
  }
  try {
    const parsed = JSON.parse(body) as { message?: string; code?: string };
    if (parsed.message) return `Cashfree: ${parsed.message}`;
  } catch {
    // Non-JSON error body; fall through to fallback
  }
  return fallback;
}

export async function createCashfreeOrder(input: {
  orderId: string;
  amountPaise: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl?: string;
  bookingReference: string;
}): Promise<CashfreeOrder> {
  const { baseUrl, headers } = cashfreeRequestConfig();
  const orderAmountRupees = Number((input.amountPaise / 100).toFixed(2));

  const res = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      order_id: sanitizeCashfreeId(input.orderId),
      order_amount: orderAmountRupees,
      order_currency: "INR",
      customer_details: {
        customer_id: sanitizeCashfreeId(input.customerId),
        customer_name: input.customerName.trim().slice(0, 100) || "Bridal Guest",
        customer_email: input.customerEmail.trim(),
        customer_phone: formatCashfreePhone(input.customerPhone),
      },
      order_meta: {
        return_url: input.returnUrl,
        ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
      },
      order_note: `Haya Bridal order ${input.bookingReference}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[cashfree] order creation failed", res.status, text.slice(0, 300));
    throw new Error(describeCashfreeFailure(res.status, text, "cashfree_order_failed"));
  }
  return (await res.json()) as CashfreeOrder;
}

export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  const { baseUrl, headers } = cashfreeRequestConfig();
  const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[cashfree] fetch order failed", res.status, text.slice(0, 300));
    throw new Error(describeCashfreeFailure(res.status, text, "cashfree_fetch_failed"));
  }
  return (await res.json()) as CashfreeOrder;
}

export async function fetchCashfreeOrderPayments(orderId: string): Promise<CashfreePayment[]> {
  const { baseUrl, headers } = cashfreeRequestConfig();
  const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[cashfree] fetch order payments failed", res.status, text.slice(0, 300));
    throw new Error(describeCashfreeFailure(res.status, text, "cashfree_payments_fetch_failed"));
  }
  const data = (await res.json()) as CashfreePayment[];
  return Array.isArray(data) ? data : [];
}

export async function createCashfreeRefund(input: {
  orderId: string;
  amountPaise: number;
  refundId: string;
  refundNote?: string;
}) {
  const { baseUrl, headers } = cashfreeRequestConfig();
  const refundAmountRupees = Number((input.amountPaise / 100).toFixed(2));
  const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(input.orderId)}/refunds`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      refund_amount: refundAmountRupees,
      refund_id: sanitizeCashfreeId(input.refundId),
      refund_note: input.refundNote?.slice(0, 100) || "Haya Bridal refund",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(describeCashfreeFailure(res.status, text, "cashfree_refund_failed"));
  }
  return JSON.parse(text);
}

/** Verify Cashfree PG webhook signature: Base64(HMAC-SHA256(timestamp + rawBody, secret)). */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  if (!timestamp || !signature) return false;
  const secret = env.cashfreeWebhookSecret();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}${rawBody}`)
    .digest("base64");

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

