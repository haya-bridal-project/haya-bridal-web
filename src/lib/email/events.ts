import "server-only";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/data/public";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { sendEmail } from "@/lib/email/send";
import { bookingRows, layout, type BookingEmailData } from "@/lib/email/templates";
import type { Booking } from "@/lib/types";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/labels";

async function ctx() {
  const s = await getSiteSettings();
  return { contact: s.contact, adminEmail: s.email.admin_notification_email || s.contact.email, site: env.siteUrl() };
}

function toData(b: Booking): BookingEmailData {
  return {
    reference: b.reference,
    customer_name: b.customer_name,
    product_name: b.product_name,
    start_date: b.start_date,
    end_date: b.end_date,
    size: b.size,
    color: b.color,
    total_paise: b.total_paise,
    deposit_paise: b.deposit_paise,
    status_label: BOOKING_STATUS_LABEL[b.status],
    payment_label: PAYMENT_STATUS_LABEL[b.payment_status],
  };
}

export async function emailEnquiryReceived(e: { id: string; name: string; email: string; phone?: string | null; message: string; productName?: string | null; kind: string }) {
  const c = await ctx();
  await sendEmail({
    dedupeKey: `enquiry:${e.id}:customer`,
    eventType: "enquiry_received",
    to: e.email,
    toName: e.name,
    subject: "We have received your enquiry",
    relatedType: "enquiry",
    relatedId: e.id,
    html: layout({
      preheader: "Thank you for contacting Haya.",
      heading: `Thank you, ${e.name}`,
      intro: "We have received your enquiry and a member of our styling team will get back to you shortly.",
      rows: [["Outfit", e.productName], ["Your message", e.message]],
      contact: c.contact,
    }),
  });
  if (c.adminEmail) {
    await sendEmail({
      dedupeKey: `enquiry:${e.id}:admin`,
      eventType: "admin_new_enquiry",
      to: c.adminEmail,
      subject: `New ${e.kind === "contact" ? "contact message" : "enquiry"} from ${e.name}`,
      relatedType: "enquiry",
      relatedId: e.id,
      html: layout({
        preheader: "New enquiry",
        heading: "New enquiry",
        intro: "A new enquiry was submitted on the website.",
        rows: [["Name", e.name], ["Email", e.email], ["Phone", e.phone], ["Outfit", e.productName], ["Message", e.message]],
        cta: { label: "Open in admin", href: `${c.site}/admin/enquiries` },
      }),
    });
  }
}

export async function emailConsultationReceived(r: { id: string; name: string; email: string; phone: string; preferred_date: string; preferred_time?: string | null; mode: string }) {
  const c = await ctx();
  const modeLabel = r.mode === "video" ? "Video call" : r.mode === "phone" ? "Phone call" : "In store";
  await sendEmail({
    dedupeKey: `consultation:${r.id}:customer`,
    eventType: "consultation_received",
    to: r.email,
    toName: r.name,
    subject: "Your consultation request",
    relatedType: "consultation",
    relatedId: r.id,
    html: layout({
      preheader: "We have received your consultation request.",
      heading: "Consultation request received",
      intro: `Dear ${r.name}, thank you for your request. We will confirm your appointment shortly.`,
      rows: [["Preferred date", formatDate(r.preferred_date)], ["Preferred time", r.preferred_time], ["Format", modeLabel]],
      contact: c.contact,
    }),
  });
  if (c.adminEmail) {
    await sendEmail({
      dedupeKey: `consultation:${r.id}:admin`,
      eventType: "admin_new_consultation",
      to: c.adminEmail,
      subject: `Consultation request from ${r.name}`,
      relatedType: "consultation",
      relatedId: r.id,
      html: layout({
        preheader: "New consultation request",
        heading: "New consultation request",
        intro: "A customer requested a consultation.",
        rows: [["Name", r.name], ["Email", r.email], ["Phone", r.phone], ["Preferred date", formatDate(r.preferred_date)], ["Preferred time", r.preferred_time], ["Format", modeLabel]],
        cta: { label: "Open in admin", href: `${c.site}/admin/consultations` },
      }),
    });
  }
}

export async function emailBookingRequested(b: Booking) {
  const c = await ctx();
  await sendEmail({
    dedupeKey: `booking:${b.id}:requested`,
    eventType: "booking_request_received",
    to: b.customer_email,
    toName: b.customer_name,
    subject: `Order request ${b.reference} received`,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({
      preheader: "Your order request has been received.",
      heading: "Order request received",
      intro: `Dear ${b.customer_name}, we have received your order request. Our team will review your customization details and confirm with you shortly.`,
      rows: bookingRows(toData(b)),
      cta: { label: "View order", href: `${c.site}/account/bookings/${b.reference}` },
      contact: c.contact,
    }),
  });
  await notifyAdminBooking(b, "New order request");
}

export async function notifyAdminBooking(b: Booking, title: string) {
  const c = await ctx();
  if (!c.adminEmail) return;
  await sendEmail({
    dedupeKey: `booking:${b.id}:admin:${title}`,
    eventType: "admin_booking_notification",
    to: c.adminEmail,
    subject: `${title}: ${b.reference}`,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({
      preheader: title,
      heading: title,
      intro: `${b.customer_name} (${b.customer_email}, ${b.customer_phone})`,
      rows: bookingRows(toData(b)),
      cta: { label: "Open in admin", href: `${c.site}/admin/bookings/${b.id}` },
    }),
  });
}

export async function emailBookingConfirmed(b: Booking, viaPayment: boolean) {
  const c = await ctx();
  await sendEmail({
    dedupeKey: `booking:${b.id}:confirmed`,
    eventType: viaPayment ? "payment_confirmation" : "booking_confirmation",
    to: b.customer_email,
    toName: b.customer_name,
    subject: viaPayment ? `Payment received, order ${b.reference} confirmed` : `Order ${b.reference} confirmed`,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({
      preheader: "Your Haya order is confirmed.",
      heading: "Your order is confirmed",
      intro: viaPayment
        ? `Dear ${b.customer_name}, we have verified your payment of ${formatINR(b.total_paise)} and your order is confirmed.`
        : `Dear ${b.customer_name}, your order has been confirmed by our team.`,
      rows: bookingRows(toData(b)),
      cta: { label: "View order", href: `${c.site}/account/bookings/${b.reference}` },
      outro: "We will contact you with shipping and tracking details as your bespoke order is prepared.",
      contact: c.contact,
    }),
  });
  if (viaPayment) await notifyAdminBooking(b, "Paid order confirmed");
}

export async function emailPaymentFailed(b: Booking, paymentId: string) {
  const c = await ctx();
  await sendEmail({
    dedupeKey: `payment:${paymentId}:failed`,
    eventType: "payment_failed",
    to: b.customer_email,
    toName: b.customer_name,
    subject: `Payment for ${b.reference} was not completed`,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({
      preheader: "Your payment did not go through.",
      heading: "Payment not completed",
      intro: `Dear ${b.customer_name}, your payment attempt for order ${b.reference} was not successful. You may try again to complete checkout.`,
      rows: bookingRows(toData(b)),
      cta: { label: "Return to checkout", href: `${c.site}/checkout/${b.reference}` },
      contact: c.contact,
    }),
  });
}

export async function emailBookingStatusChanged(b: Booking, note?: string | null) {
  const c = await ctx();
  const map: Partial<Record<Booking["status"], { subject: string; heading: string; intro: string }>> = {
    cancelled: { subject: `Order ${b.reference} cancelled`, heading: "Order cancelled", intro: `Dear ${b.customer_name}, your order has been cancelled.` },
    rejected: { subject: `Order request ${b.reference} could not be accepted`, heading: "Order request update", intro: `Dear ${b.customer_name}, unfortunately we are unable to accept this order request.` },
  };
  if (b.status === "confirmed") return emailBookingConfirmed(b, false);
  const m = map[b.status];
  if (!m) return;
  await sendEmail({
    dedupeKey: `booking:${b.id}:${b.status}`,
    eventType: `booking_${b.status}`,
    to: b.customer_email,
    toName: b.customer_name,
    subject: m.subject,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({ preheader: m.heading, heading: m.heading, intro: m.intro, rows: [...bookingRows(toData(b)), ["Note", note ?? null]], contact: c.contact }),
  });
}

export async function emailRefundUpdate(b: Booking, refund: { id: string; status: string; amount_paise: number }) {
  const c = await ctx();
  await sendEmail({
    dedupeKey: `refund:${refund.id}:${refund.status}`,
    eventType: "refund_update",
    to: b.customer_email,
    toName: b.customer_name,
    subject: `Refund update for ${b.reference}`,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({
      preheader: "Refund update",
      heading: "Refund update",
      intro: `Dear ${b.customer_name}, here is the latest status of your refund.`,
      rows: [["Order reference", b.reference], ["Refund amount", formatINR(refund.amount_paise)], ["Refund status", refund.status], ["Refund reference", refund.id]],
      outro: "Refunds are processed by Razorpay to your original payment method. Bank timelines may vary.",
      contact: c.contact,
    }),
  });
}


export async function emailPasswordResetOtp(to: string, otp: string, userName?: string | null) {
  const c = await ctx();
  const esc = (s?: string | null) => (s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const safeName = userName ? esc(userName) : null;
  const safeOtp = esc(otp);
  const nameGreeting = safeName ? `Dear ${safeName}, ` : "Hello, ";
  const contactLine = [c.contact?.phone, c.contact?.email]
    .filter((v): v is string => Boolean(v))
    .map((v) => esc(v))
    .join(" &middot; ");
  return await sendEmail({
    eventType: "password_reset_otp",
    to,
    toName: userName ?? undefined,
    subject: `Your Haya Account Password Reset Code: ${otp}`,
    html: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Password Reset OTP</title></head>
<body style="margin:0;padding:0;background:#FAF6F0;font-family:Helvetica,Arial,sans-serif;color:#2B211C">
<span style="display:none;max-height:0;overflow:hidden">Your password reset verification code is ${safeOtp}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#FFFFFF;border:1px solid #E8DDD1;border-radius:4px;overflow:hidden">
<tr><td style="padding:28px 32px 8px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:1px;color:#2B211C">Haya</td></tr>
<tr><td style="padding:0 32px 20px;text-align:center;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7A6A5F">Bridal Couture &amp; Fine Ornaments</td></tr>
<tr><td style="border-top:1px solid #E8DDD1;padding:28px 32px 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#2B211C;text-align:center">Password Reset Verification</td></tr>
<tr><td style="padding:0 32px 16px;font-size:14px;line-height:22px;color:#5A4C42;text-align:center">
${nameGreeting}we received a request to reset your password. Use the verification code below to set a new password:
</td></tr>
<tr><td align="center" style="padding:10px 32px 20px">
  <div style="display:inline-block;background:#FAF6F0;border:1.5px dashed #B06F5E;border-radius:6px;padding:16px 36px;letter-spacing:8px;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;color:#B06F5E">
    ${safeOtp}
  </div>
</td></tr>
<tr><td style="padding:0 32px 24px;font-size:12px;line-height:19px;color:#7A6A5F;text-align:center">
This one-time passcode will expire in <strong>10 minutes</strong>. If you did not request this password reset, you can safely ignore this email &mdash; your account remains secure.
</td></tr>
<tr><td style="border-top:1px solid #E8DDD1;padding:16px 32px;font-size:11px;color:#7A6A5F;text-align:center">
${contactLine || "Haya Bridal Couture &amp; Fine Ornaments &middot; Secure Client Portal"}
</td></tr>
</table></td></tr></table></body></html>`,
  });
}

export async function emailPasswordChanged(to: string, userName?: string | null) {
  const c = await ctx();
  return await sendEmail({
    eventType: "password_changed_confirmation",
    to,
    toName: userName ?? undefined,
    subject: "Your Haya Account Password Was Reset",
    html: layout({
      preheader: "Your account password was successfully updated.",
      heading: "Password Updated",
      intro: `Your password for ${to} has been successfully updated. You can now sign in with your new password.`,
      cta: { label: "Sign In to Your Account", href: `${c.site}/login` },
      outro: "If you did not perform this change, please contact us immediately to protect your account.",
      contact: c.contact,
    }),
  });
}
