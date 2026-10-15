// Cloudflare Access (Zero Trust) JWT verification.
//
// Access sits in front of /api/export* and only lets board members through, but
// the Worker must still verify the token it forwards. Without this check anyone
// who learns the *.pages.dev origin can request the CSV directly and bypass the
// policy entirely — Access protects the hostname, not the code.
//
// This fails CLOSED: if ACCESS_TEAM_DOMAIN or ACCESS_AUD is missing, every
// request is refused. The old ADMIN_TOKEN check did the opposite, and a missing
// secret silently published every family's name and email.

const JWKS_TTL_MS = 60 * 60 * 1000; // Cloudflare rotates these keys ~every 6 weeks
const CLOCK_SKEW_S = 60;

let jwksCache = { url: null, keys: null, at: 0 };

export async function verifyAccess(request, env) {
  const team = normalizeTeamDomain(env.ACCESS_TEAM_DOMAIN);
  const aud = env.ACCESS_AUD;
  if (!team || !aud) {
    return fail(500, "Export is not configured. Set ACCESS_TEAM_DOMAIN and ACCESS_AUD.");
  }

  const token = readToken(request);
  if (!token) return fail(401, "No Access token. Reach this URL through your board login.");

  const parts = token.split(".");
  if (parts.length !== 3) return fail(401, "Malformed Access token.");
  const [headerB64, payloadB64, sigB64] = parts;

  let header, payload;
  try {
    header = jsonFromB64url(headerB64);
    payload = jsonFromB64url(payloadB64);
  } catch {
    return fail(401, "Malformed Access token.");
  }

  if (header.alg !== "RS256") return fail(401, "Unexpected token algorithm.");

  const key = await findKey(team, header.kid);
  if (!key) return fail(401, "Access token was signed by an unknown key.");

  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      bytesFromB64url(sigB64),
      signed
    );
  } catch {
    valid = false;
  }
  if (!valid) return fail(401, "Access token signature did not verify.");

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp + CLOCK_SKEW_S < now) {
    return fail(401, "Access token expired. Sign in again.");
  }
  if (typeof payload.nbf === "number" && payload.nbf - CLOCK_SKEW_S > now) {
    return fail(401, "Access token is not valid yet.");
  }
  if (payload.iss !== `https://${team}`) {
    return fail(401, "Access token came from a different team.");
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(aud)) {
    return fail(401, "Access token is for a different application.");
  }

  const email = String(payload.email || "").toLowerCase();

  // Belt and braces. The Access policy is the real gate; this is a second one
  // you control from here, in case the policy is ever widened by accident.
  const allowed = (env.ACCESS_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length && !allowed.includes(email)) {
    return fail(403, "Your account is not on the export list.");
  }

  return { ok: true, email };
}

function fail(status, message) {
  return { ok: false, status, message };
}

function readToken(request) {
  const header = request.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header.trim();

  // Browsers hitting the URL directly carry the cookie instead of the header.
  const cookie = request.headers.get("Cookie") || "";
  const match = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

function normalizeTeamDomain(raw) {
  if (!raw) return "";
  let d = String(raw).trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  // Accept either 'myteam' or the full 'myteam.cloudflareaccess.com'.
  if (d && !d.includes(".")) d = `${d}.cloudflareaccess.com`;
  return d;
}

async function findKey(team, kid) {
  const url = `https://${team}/cdn-cgi/access/certs`;
  const fresh = jwksCache.url === url && Date.now() - jwksCache.at < JWKS_TTL_MS;

  if (fresh) {
    const hit = jwksCache.keys.get(kid);
    if (hit) return hit;
  }

  // Unknown kid, or a stale cache: refetch. Covers key rotation.
  let doc;
  try {
    const res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!res.ok) return null;
    doc = await res.json();
  } catch {
    return null;
  }

  const keys = new Map();
  for (const jwk of doc.keys || []) {
    if (jwk.kty !== "RSA" || !jwk.n || !jwk.e) continue;
    try {
      keys.set(
        jwk.kid,
        await crypto.subtle.importKey(
          "jwk",
          { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"]
        )
      );
    } catch {
      // Skip a key we can't import rather than failing the whole set.
    }
  }

  jwksCache = { url, keys, at: Date.now() };
  return keys.get(kid) || null;
}

function bytesFromB64url(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function jsonFromB64url(s) {
  return JSON.parse(new TextDecoder().decode(bytesFromB64url(s)));
}
