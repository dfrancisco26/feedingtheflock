// GET /api/export?period=2026-10
// Returns a CSV of that month's signups. Defaults to the current month.
//
// Guarded by Cloudflare Access. Put a policy on /api/export* limited to the
// board's email addresses; this code independently verifies the signed token
// Access forwards, so hitting the *.pages.dev origin directly does not work.
//
// Requires ACCESS_TEAM_DOMAIN and ACCESS_AUD. Without them every request is
// refused — see lib/access.js for why it fails closed rather than open.

import { verifyAccess } from "../../lib/access.js";
import { currentPeriod, isPeriod } from "../../lib/period.js";
import { purgeInBackground } from "../../lib/retention.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const auth = await verifyAccess(request, env);
  if (!auth.ok) {
    return new Response(auth.message, {
      status: auth.status,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || currentPeriod();
  if (!isPeriod(period)) {
    return new Response("Bad period. Use YYYY-MM.", { status: 400 });
  }

  const { results } = await env.DB.prepare(
    `SELECT created_at, first_name, last_name, email, families, lang,
            email_status, email_error
       FROM signups
      WHERE period = ?
      ORDER BY created_at`
  ).bind(period).all();

  // An empty month is ambiguous: nobody signed up, or the month aged out of
  // retention. period_stats tells the board which, instead of showing a blank.
  if (results.length === 0) {
    const archived = await env.DB.prepare(
      "SELECT signups, families, archived_at FROM period_stats WHERE period = ?"
    ).bind(period).first();
    if (archived) {
      return new Response(
        `No personal data for ${period}. It passed the 12-month retention window and was ` +
        `deleted on ${archived.archived_at}. That month had ${archived.signups} signups ` +
        `covering ${archived.families} families.`,
        { status: 410, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }
      );
    }
  }

  const rows = [[
    "Signed up", "First", "Last", "Email", "Families", "Language",
    "Confirmation", "Confirmation problem",
  ]];
  for (const r of results) {
    rows.push([
      r.created_at,
      r.first_name,
      r.last_name,
      r.email,
      String(r.families),
      r.lang === "es" ? "Spanish" : "English",
      confirmationLabel(r.email_status),
      r.email_error || "",
    ]);
  }
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

  const unconfirmed = results.filter((r) => r.email_status === "failed").length;
  console.log(
    `export ${period} by ${auth.email} (${results.length} rows` +
    `${unconfirmed ? `, ${unconfirmed} with failed confirmations` : ""})`
  );
  purgeInBackground(context);

  // BOM so Excel opens accented names correctly.
  return new Response("\uFEFF" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="signups-${period}.csv"`,
      "cache-control": "no-store",
    },
  });
}

// Plain words rather than codes — a board member reading the sheet should not
// have to ask what 'skipped' means.
function confirmationLabel(status) {
  switch (status) {
    case "sent":    return "Sent";
    case "failed":  return "NOT SENT — follow up";
    case "pending": return "Still sending";
    case "skipped": return "Email not set up";
    default:        return status || "";
  }
}

function csvCell(v) {
  const s = String(v ?? "");
  // Leading =, +, -, @ make Excel and Sheets treat the cell as a formula.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
