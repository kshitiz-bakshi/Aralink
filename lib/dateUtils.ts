/**
 * Shared date formatting utilities. All display dates go through here
 * so the format is consistent across the entire app.
 *
 * fmtDate      → "June 28, 2026"          (detail sections: full month name)
 * fmtShortDate → "2026-06-28"             (lists / chart labels: yyyy-mm-dd)
 * fmtDateTime  → "June 28, 2026, 4:34 PM" (timestamps: comments, activity)
 */

function parseDate(iso: string): Date {
  // Append time so Date doesn't shift by timezone offset on date-only strings
  return new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
}

export function fmtDate(iso: string | null | undefined, fallback = 'N/A'): string {
  if (!iso) return fallback;
  const d = parseDate(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function fmtShortDate(iso: string | null | undefined, fallback = ''): string {
  if (!iso) return fallback;
  const d = parseDate(iso);
  if (isNaN(d.getTime())) return fallback;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtDateTime(iso: string | null | undefined, fallback = 'N/A'): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/** Convert a Date object → "MM/DD/YYYY" string for storing in form fields */
/** Format a Date as YYYY-MM-DD using LOCAL date parts (toISOString shifts across
 *  midnight in non-UTC timezones and can save the wrong day from a date picker). */
export function toISODateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtDateInput(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Sentinel "no end date" value for open-ended / month-to-month tenancies,
 *  in the same MM/DD/YYYY format used for lease dates in the tenant screens. */
export const OPEN_ENDED_END_DATE = '12/31/9999';

/** True if a stored end date represents an open-ended (no fixed end) tenancy,
 *  regardless of whether it's stored as MM/DD/YYYY or ISO (year 9999 either way). */
export function isOpenEndedDate(value?: string | null): boolean {
  if (!value) return false;
  return toValidDate(value).getFullYear() >= 9999;
}

/** Coerce any date-ish input (Date, ISO string, MM/DD/YYYY string, null, undefined)
 *  into a valid Date. Falls back to "now" instead of ever producing an Invalid
 *  Date / epoch (1969-1970) — the classic date-picker default bug. Hermes (the
 *  Android JS engine) only reliably parses ISO-8601, so MM/DD/YYYY is parsed
 *  manually rather than handed to `new Date(string)`. */
export function toValidDate(value?: Date | string | null): Date {
  if (!value) return new Date();
  if (value instanceof Date) return isNaN(value.getTime()) ? new Date() : value;

  const mdy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const d = new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]));
    return isNaN(d.getTime()) ? new Date() : d;
  }

  const d = new Date(value.includes('T') ? value : value + 'T00:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}
