// Month arithmetic, in one place so signup, export, and the purge can't drift.
//
// Lives outside functions/ on purpose: anything under functions/ becomes a
// public route, and this is internal.

const TZ = "America/Los_Angeles";

// The month is always decided here, from San Diego local time — never from the
// browser, and never from the Worker's UTC clock (which rolls over up to 8
// hours early).
export function currentPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  return `${y}-${m}`;
}

// Today's date in San Diego, 'YYYY-MM-DD'. Used to rate-limit the purge to
// once a day.
export function currentDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// shiftPeriod('2026-01', -12) === '2025-01'
export function shiftPeriod(period, months) {
  const [y, m] = period.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12 + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

export function isPeriod(v) {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

// 'October 2026' / 'octubre de 2026'. Noon UTC keeps the date off a boundary.
export function monthLabel(period, lang = "en") {
  return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${period}-01T12:00:00Z`));
}
