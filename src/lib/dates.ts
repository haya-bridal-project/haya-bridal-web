/**
 * Date rules (documented in README):
 * - Rental dates are calendar dates (YYYY-MM-DD) in Asia/Kolkata.
 * - A rental of N days starting S ends on S + N - 1 (inclusive).
 * - Occupancy = [start, end + bufferDays] inclusive. Two occupancies conflict
 *   when they share at least one calendar day.
 */

export const TIMEZONE = "Asia/Kolkata";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: unknown): s is string {
  if (typeof s !== "string" || !ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function rentalEndDate(start: string, durationDays: number): string {
  return addDays(start, durationDays - 1);
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function occupancyOverlaps(
  a: { start: string; end: string; buffer: number },
  b: { start: string; end: string; buffer: number },
): boolean {
  return rangesOverlap(a.start, addDays(a.end, a.buffer), b.start, addDays(b.end, b.buffer));
}

const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (iso.length === 10) return fmt.format(d);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: TIMEZONE }).format(d);
}
