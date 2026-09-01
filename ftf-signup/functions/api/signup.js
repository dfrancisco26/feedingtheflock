// POST /api/signup
// Bindings: DB (D1)
// Secrets:  TURNSTILE_SECRET, IP_SALT, CF_ACCOUNT_ID, EMAIL_API_TOKEN,
//           FROM_EMAIL, FROM_NAME  (all optional; each degrades safely)
//
// This endpoint returns error *codes*, never prose. The browser owns all
// user-facing wording in both languages (the `T` object in index.html), so the
// two never disagree and adding a third language touches only the page.
// The one exception is periods.note — free text an admin wrote deliberately,
// passed through as-is.

import { currentPeriod } from "../../lib/period.js";
import { sendConfirmation, emailConfigured, PENDING, SKIPPED } from "../../lib/email.js";
import { purgeInBackground } from "../../lib/retention.js";

const MAX_FAMILIES = 10;
const LANGS = ["en", "es"];

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }

  const first = clean(body.first_name, 60);
  const last = clean(body.last_name, 60);
  const email = clean(body.email, 254);
  const families = Number.parseInt(body.families, 10);
  const lang = LANGS.includes(body.lang) ? body.lang : "en";

  const fields = {};
  if (!first) fields.first_name = "required";
  if (!last) fields.last_name = "required";
  if (!isEmail(email)) fields.email = "email_invalid";
  if (!Number.isInteger(families) || families < 1 || families > MAX_FAMILIES) {
    fields.families = "families_range";
  }
  if (Object.keys(fields).length) {
    return json({ code: "check_fields", fields, max: MAX_FAMILIES }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(body.turnstile_token, env.TURNSTILE_SECRET, ip);
    if (!ok) return json({ code: "turnstile_failed" }, 400);
  }

  // The month is decided here, never by the browser.
  const period = currentPeriod();

  const control = await env.DB.prepare(
    "SELECT capacity, is_open, note FROM periods WHERE period = ?"
  ).bind(period).first();

  if (control && control.is_open === 0) {
    // note is admin-authored copy; send it through verbatim when present.
    return json({ code: "month_closed", note: control.note || null }, 409);
  }

  if (control && control.capacity != null) {
    const used = await env.DB.prepare(
      "SELECT COALESCE(SUM(families), 0) AS total FROM signups WHERE period = ?"
    ).bind(period).first();
    if (used.total + families > control.capacity) {
      return json({ code: "month_full" }, 409);
    }
  }

  const emailNorm = email.trim().toLowerCase();
  const ipHash = env.IP_SALT ? await sha256(ip + env.IP_SALT) : null;

  // Recorded up front so a row is never ambiguous: 'pending' means a send was
  // attempted and we are waiting on it, 'skipped' means email isn't set up at
  // all. sendConfirmation overwrites 'pending' with the real outcome.
  const willSend = emailConfigured(env);
  const initialStatus = willSend ? PENDING : SKIPPED;

  try {
    await env.DB.prepare(
      `INSERT INTO signups (period, first_name, last_name, email, email_norm, families, lang, ip_hash, email_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(period, first, last, email, emailNorm, families, lang, ipHash, initialStatus).run();
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return json({ code: "duplicate" }, 409);
    }
    console.error("insert failed", err);
    return json({ code: "save_failed" }, 500);
  }

  // Both of these run after the response. Neither can fail a saved signup.
  if (willSend) {
    context.waitUntil(
      sendConfirmation(env, { first, last, email, emailNorm, families, period, lang })
    );
  }
  purgeInBackground(context);

  return json({ ok: true, period }, 200);
}

async function verifyTurnstile(token, secret, ip) {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

function clean(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
