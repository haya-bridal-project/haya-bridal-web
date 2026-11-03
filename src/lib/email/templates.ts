import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";

type Row = [label: string, value: string | null | undefined];

const C = {
  bg: "#FAF6F0",
  card: "#FFFFFF",
  line: "#E8DDD1",
  ink: "#2B211C",
  muted: "#7A6A5F",
  accent: "#B06F5E",
};

export function layout(opts: {
  preheader: string;
  heading: string;
  intro: string;
  rows?: Row[];
  cta?: { label: string; href: string };
  outro?: string;
  contact?: { phone?: string | null; email?: string | null } | null;
}) {
  const rows = (opts.rows ?? []).filter((r) => r[1] != null && r[1] !== "");
  const esc = (s?: string | null) => (s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const contactLine = [opts.contact?.phone, opts.contact?.email]
    .filter((v): v is string => Boolean(v))
    .map((v) => esc(v))
    .join(" &middot; ");

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Helvetica,Arial,sans-serif;color:${C.ink}">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border:1px solid ${C.line}">
<tr><td style="padding:28px 32px 8px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:1px;color:${C.ink}">Haya</td></tr>
<tr><td style="padding:0 32px 20px;text-align:center;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.muted}">Bridal Couture &amp; Fine Ornaments</td></tr>
<tr><td style="border-top:1px solid ${C.line};padding:28px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${C.ink}">${esc(opts.heading)}</td></tr>
<tr><td style="padding:0 32px 16px;font-size:14px;line-height:22px;color:${C.ink}">${esc(opts.intro)}</td></tr>
${rows.length ? `<tr><td style="padding:0 32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">${rows
    .map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:12px;color:${C.muted};width:42%">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:13px;color:${C.ink}">${esc(v)}</td></tr>`)
    .join("")}</table></td></tr>` : ""}
${opts.cta ? `<tr><td style="padding:8px 32px 24px"><a href="${esc(opts.cta.href)}" style="display:inline-block;background:${C.accent};color:#fff;text-decoration:none;font-size:13px;padding:12px 22px;border-radius:2px">${esc(opts.cta.label)}</a></td></tr>` : ""}
${opts.outro ? `<tr><td style="padding:0 32px 24px;font-size:13px;line-height:21px;color:${C.muted}">${esc(opts.outro)}</td></tr>` : ""}
<tr><td style="border-top:1px solid ${C.line};padding:18px 32px;font-size:11px;color:${C.muted};text-align:center">${contactLine || "Haya Bridal Couture & Fine Ornaments"}</td></tr>
</table></td></tr></table></body></html>`;
}

export type BookingEmailData = {
  reference: string;
  customer_name: string;
  product_name: string;
  start_date: string;
  end_date: string;
  size?: string | null;
  color?: string | null;
  total_paise: number;
  deposit_paise: number;
  status_label: string;
  payment_label: string;
};

export function bookingRows(b: BookingEmailData): Row[] {
  return [
    ["Order Reference", b.reference],
    ["Item", b.product_name],
    ["Order Date", formatDate(b.start_date)],
    ["Size / Fit", b.size],
    ["Colour", b.color],
    ["Total Paid", formatINR(b.total_paise)],
    ["Order Status", b.status_label],
    ["Payment Status", b.payment_label],
  ];
}
