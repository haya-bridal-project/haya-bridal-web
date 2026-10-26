/** All money is integer paise. Never use floats for arithmetic. */

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inrPrecise = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatINR(paise: number | null | undefined): string {
  if (paise == null || !Number.isFinite(paise)) return "";
  const rupees = Math.trunc(paise / 100);
  const rem = Math.abs(paise % 100);
  return rem === 0 ? `\u20B9${inr.format(rupees)}` : `\u20B9${inrPrecise.format(paise / 100)}`;
}

/** Parses an admin-entered rupee value like "12,000" or "12000.50" to paise. */
export function rupeesToPaise(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).replace(/[,\s\u20B9]/g, "");
  if (s === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

export function paiseToRupeesInput(paise: number | null | undefined): string {
  if (paise == null) return "";
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

export type PriceBreakdown = {
  rental_paise: number;
  deposit_paise: number;
  fees_paise: number;
  discount_paise: number;
  total_paise: number;
};

/**
 * Mirrors the database pricing in create_booking() for display.
 * The database result is always authoritative.
 */
export function computeRentalPrice(input: {
  basePricePaise: number;
  baseDurationDays: number;
  options: { duration_days: number; price_paise: number }[];
  durationDays: number;
  depositPaise: number;
  feesPaise: number;
}): PriceBreakdown | null {
  let rental: number | undefined;
  if (input.durationDays === input.baseDurationDays) rental = input.basePricePaise;
  else rental = input.options.find((o) => o.duration_days === input.durationDays)?.price_paise;
  if (rental == null) return null;
  for (const v of [rental, input.depositPaise, input.feesPaise]) {
    if (!Number.isInteger(v) || v < 0) return null;
  }
  return {
    rental_paise: rental,
    deposit_paise: input.depositPaise,
    fees_paise: input.feesPaise,
    discount_paise: 0,
    total_paise: rental + input.depositPaise + input.feesPaise,
  };
}

export function durationChoices(p: {
  rental_duration_days: number;
  rental_price_paise: number;
  options?: { duration_days: number; price_paise: number }[];
}) {
  const list = [{ duration_days: p.rental_duration_days, price_paise: p.rental_price_paise }];
  for (const o of p.options ?? []) {
    if (!list.some((l) => l.duration_days === o.duration_days)) list.push(o);
  }
  return list.sort((a, b) => a.duration_days - b.duration_days);
}

export function daysLabel(n: number) {
  return `${n} ${n === 1 ? "Day" : "Days"}`;
}
