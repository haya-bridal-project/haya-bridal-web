import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

function authHeader() {
  const { keyId, keySecret } = env.razorpay();
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };

export async function createOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }): Promise<RazorpayOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new Error("invalid_amount");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt.slice(0, 40), notes: input.notes }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[razorpay] order creation failed", res.status, text.slice(0, 300));
    throw new Error("razorpay_order_failed");
  }
  return (await res.json()) as RazorpayOrder;
}

export async function fetchPayment(paymentId: string) {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error("razorpay_fetch_failed");
  return (await res.json()) as { id: string; order_id: string; amount: number; currency: string; status: string; method?: string };
}

export async function createRefund(paymentId: string, amountPaise: number, notes: Record<string, string>) {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, notes }),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; status?: string; error?: { description?: string } };
  if (!res.ok) throw new Error(json.error?.description ?? "razorpay_refund_failed");
  return json as { id: string; status: string };
}
