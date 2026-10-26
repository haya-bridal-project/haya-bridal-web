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
    subject: `Booking request ${b.reference} received`,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({
      preheader: "Your booking request has been received.",
      heading: "Booking request received",
      intro: `Dear ${b.customer_name}, we have received your rental request. Our team will review availability and confirm with you shortly. Your booking is not confirmed until you hear from us.`,
      rows: bookingRows(toData(b)),
      cta: { label: "View booking", href: `${c.site}/account/bookings/${b.reference}` },
      contact: c.contact,
    }),
  });
  await notifyAdminBooking(b, "New booking request");
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
    subject: viaPayment ? `Payment received, booking ${b.reference} confirmed` : `Booking ${b.reference} confirmed`,
    relatedType: "booking",
    relatedId: b.id,
    html: layout({
      preheader: "Your Haya rental is confirmed.",
      heading: "Your booking is confirmed",
      intro: viaPayment
        ? `Dear ${b.customer_name}, we have verified your payment of ${formatINR(b.total_paise)} and your rental is confirmed.`
        : `Dear ${b.customer_name}, your rental has been confirmed by our team.`,
      rows: bookingRows(toData(b)),
      cta: { label: "View booking", href: `${c.site}/account/bookings/${b.reference}` },
      outro: "We will contact you with pickup details before your rental date.",
      contact: c.contact,
    }),
  });
  if (viaPayment) await notifyAdminBooking(b, "Paid booking confirmed");
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
      intro: `Dear ${b.customer_name}, your payment attempt for booking ${b.reference} was not successful. No booking has been confirmed. You may try again while your reservation hold is active.`,
      rows: bookingRows(toData(b)),
      cta: { label: "Return to checkout", href: `${c.site}/checkout/${b.reference}` },
      contact: c.contact,
    }),
  });
}

export async function emailBookingStatusChanged(b: Booking, note?: string | null) {
  const c = await ctx();
  const map: Partial<Record<Booking["status"], { subject: string; heading: string; intro: string }>> = {
    cancelled: { subject: `Booking ${b.reference} cancelled`, heading: "Booking cancelled", intro: `Dear ${b.customer_name}, your booking has been cancelled.` },
    rejected: { subject: `Booking request ${b.reference} could not be accepted`, heading: "Booking request update", intro: `Dear ${b.customer_name}, unfortunately we are unable to accept this booking request.` },
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
      rows: [["Booking reference", b.reference], ["Refund amount", formatINR(refund.amount_paise)], ["Refund status", refund.status], ["Refund reference", refund.id]],
      outro: "Refunds are processed by Razorpay to your original payment method. Bank timelines may vary.",
      contact: c.contact,
    }),
  });
}
