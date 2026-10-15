// Confirmation email via Cloudflare Email Sending (REST API), in the language
// the family filled the form out in.
//
// The REST API rather than the env.EMAIL binding: Pages Functions only support
// a subset of bindings (KV, D1, R2, Queues, Durable Objects, Service, Hyperdrive)
// and email sending is not among them.
//
// Every send records its outcome on the signup row, so a quota or delivery
// failure shows up as a column in the month's CSV instead of vanishing into
// console logs. That is the whole point: nobody watches Worker logs, but the
// board does read the list.

import { monthLabel } from "./period.js";

const ENDPOINT = (accountId) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`;

// Values stored in signups.email_status.
export const SENT = "sent";
export const FAILED = "failed";
export const SKIPPED = "skipped";   // no email configured; not an error
export const PENDING = "pending";   // row written, send not resolved yet

const COPY = {
  en: {
    subject: (month) => `You're signed up for ${month} food distribution`,
    body: (s, month) =>
      `Hi ${s.first},\n\n` +
      `You're signed up for the ${month} food distribution with Feeding the Flock SD.\n\n` +
      `Families you're picking up for: ${s.families}\n\n` +
      `We'll email you the date, time, and location before distribution day. ` +
      `If you need to change or cancel, just reply to this message.\n\n` +
      `— Feeding the Flock SD`,
  },
  es: {
    subject: (month) => `Ya está inscrito para la distribución de alimentos de ${month}`,
    body: (s, month) =>
      `Hola ${s.first}:\n\n` +
      `Ya está inscrito para la distribución de alimentos de ${month} con Feeding the Flock SD.\n\n` +
      `Familias para las que va a recoger: ${s.families}\n\n` +
      `Le enviaremos por correo la fecha, la hora y el lugar antes del día de la distribución. ` +
      `Si necesita cambiar o cancelar su inscripción, solo responda a este mensaje.\n\n` +
      `— Feeding the Flock SD`,
  },
};

export function emailConfigured(env) {
  return Boolean(env.CF_ACCOUNT_ID && env.EMAIL_API_TOKEN && env.FROM_EMAIL);
}

// Sends, then records the outcome. Never throws — callers run this from
// waitUntil, after the signup is already committed.
export async function sendConfirmation(env, s) {
  let status = FAILED;
  let detail = null;

  try {
    const outcome = await deliver(env, s);
    status = outcome.status;
    detail = outcome.detail;
  } catch (err) {
    detail = truncate(String(err));
    console.error("confirmation send threw", err);
  }

  await recordStatus(env, s, status, detail);
  return { status, detail };
}

async function deliver(env, s) {
  const lang = COPY[s.lang] ? s.lang : "en";
  const copy = COPY[lang];
  const month = monthLabel(s.period, lang);

  const res = await fetch(ENDPOINT(env.CF_ACCOUNT_ID), {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.EMAIL_API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: { email: env.FROM_EMAIL, name: env.FROM_NAME || "Feeding the Flock SD" },
      to: { email: s.email, name: `${s.first} ${s.last}` },
      subject: copy.subject(month),
      text: copy.body(s, month),
    }),
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response; fall through to the status-code check below.
  }

  if (!res.ok) {
    // 429 (code 10004) is the quota/rate limit. Recorded like any other
    // failure — visible in the CSV, and the row is already saved.
    const code = body?.errors?.[0]?.code;
    const msg = body?.errors?.[0]?.message || res.statusText;
    return { status: FAILED, detail: truncate(`HTTP ${res.status}${code ? ` (${code})` : ""}: ${msg}`) };
  }

  if (body && body.success === false) {
    return { status: FAILED, detail: truncate(body.errors?.map((e) => e.message).join("; ") || "api reported failure") };
  }

  // Accepted, but the address may still have been rejected outright.
  const bounced = body?.result?.permanent_bounces || [];
  if (bounced.length) {
    return { status: FAILED, detail: "permanent bounce" };
  }

  return { status: SENT, detail: null };
}

// Addressed by (period, email_norm) — the unique index — rather than a row id,
// so this stays correct regardless of how the insert reported itself.
async function recordStatus(env, s, status, detail) {
  try {
    await env.DB.prepare(
      `UPDATE signups SET email_status = ?, email_error = ?
        WHERE period = ? AND email_norm = ?`
    ).bind(status, detail, s.period, s.emailNorm).run();
  } catch (err) {
    // The signup itself is safe; we just could not annotate it.
    console.error("could not record email status", err);
  }
}

function truncate(s) {
  return String(s).slice(0, 200);
}
