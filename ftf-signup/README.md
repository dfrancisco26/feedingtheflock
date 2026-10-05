# Monthly food distribution signup

Cloudflare Pages (static form) + Pages Functions (API) + D1 (storage).
No server to run, no CMS, free at this volume.

```
public/index.html          the form, and all user-facing wording in EN + ES
functions/api/signup.js    POST — validate, dedupe, store, confirm
functions/api/export.js    GET  — CSV of a month's signups, behind Access
lib/period.js              month arithmetic, San Diego time
lib/access.js              Cloudflare Access JWT verification
lib/retention.js           12-month purge + permanent count rollup
lib/email.js               bilingual confirmation email
schema.sql                 D1 tables
```

`lib/` sits outside `functions/` on purpose — anything under `functions/`
becomes a public route.

## This folder lives inside the marketing site's repo

`ftf-signup/` is nested in `feeding_the_flock/`, but it is a **separate deploy**
with its own `wrangler.toml`. Two consequences:

- **Run every wrangler command from inside this folder.** From the repo root
  wrangler picks up the *site's* `wrangler.jsonc` instead and will deploy the
  wrong project.
- **The repo root's `.assetsignore` must keep its `ftf-signup` entry.** The site
  is served with `assets.directory: "."`, so without that line this folder's
  source, `schema.sql`, and `wrangler.toml` are downloadable from
  feedingtheflocksd.org. Verified: with the entry those paths 404, without it
  they return 200.

## How "monthly" works

There is no separate form each month. Every row carries a `period` (`YYYY-MM`)
that the **server** assigns from San Diego local time — the browser never gets to
say which month it is. A unique index on `(period, email_norm)` means one signup
per email per month, and the same person can sign up again next month without
any action from you. Nothing to reset, nothing to remember to do on the 1st.

## How the two languages stay in sync

The API never returns English prose. It returns **codes** — `duplicate`,
`month_full`, `email_invalid` — and `public/index.html` resolves them against
its `T` object, in whichever language the visitor is reading. One consequence
worth knowing: **to add a language you only touch the page.** Add a third key to
`T` and the server needs no change.

The one thing that passes through verbatim is `periods.note`, because that's
copy a board member deliberately wrote for a closed month. Write it in whichever
language you want families to see, or leave it `NULL` for the built-in
translated wording.

Unknown codes fall back to a generic message, so shipping a new server code
before the page catches up degrades quietly instead of showing a blank error.

The language a family used is stored on their row and drives the confirmation
email, and it appears as a `Language` column in the CSV — so whoever calls
families back knows which ones to greet in Spanish.

## Confirmation email

Sent through **Cloudflare Email Sending**, via the REST API rather than the
`env.EMAIL` binding — Pages Functions only support a subset of bindings (KV, D1,
R2, Queues, Durable Objects, Service, Hyperdrive) and email is not one of them.

On the Workers Paid plan this includes 3,000 emails/month, then $0.35 per 1,000.
Cloudflare signs DKIM and ARC automatically for domains it hosts, which is the
main reason this beats a third-party SMTP provider here: misconfigured domain
authentication is the usual cause of confirmations landing in spam.

**Before it can send to families you must onboard `feedingtheflocksd.org` as a
sending domain.** Until then Cloudflare only allows sending to verified
destination addresses inside your own account.

**Every send records its outcome on the signup row** (`email_status`), which the
CSV shows as a `Confirmation` column:

| Value | Means |
|---|---|
| `Sent` | accepted by Cloudflare for delivery |
| `NOT SENT — follow up` | rejected, bounced, or quota hit; reason in the next column |
| `Still sending` | send hadn't resolved when the row was read; rare |
| `Email not set up` | no email configuration present |

This exists because new accounts start on a conservative, unpublished daily
quota that scales with sending reputation. If you ever hit it, the affected
families appear in the month's list as `NOT SENT` instead of silently never
hearing from you — and you can file Cloudflare's limit-increase request form.

A send failure can never fail a signup: the row is committed before the send is
attempted, and the send runs in `waitUntil` after the response has gone out.

## Setup

1. **Create the database**

   ```bash
   npx wrangler d1 create ftf-signups
   ```

   Paste the returned `database_id` into `wrangler.toml`, then:

   ```bash
   npx wrangler d1 execute ftf-signups --remote --file=./schema.sql
   ```

2. **Turnstile** — in the dashboard, create a widget for your domain. Put the
   site key into the `data-sitekey` attribute in `index.html` (already set to
   `0x4AAAAAAEnchRw9eIZnSXbK`), and its secret key into `TURNSTILE_SECRET`
   below. Both halves are required: a deployed site missing the secret refuses
   every signup rather than accepting them unchecked.

3. **Deploy**

   ```bash
   npx wrangler pages deploy
   ```

   Then in Pages → Settings → Functions, add the D1 binding `DB` → `ftf-signups`.

4. **Secrets** (Pages → Settings → Environment variables, mark as encrypted):

   | Name | Purpose |
   |---|---|
   | `TURNSTILE_SECRET` | **required** — bot check; signups fail closed without it |
   | `IP_SALT` | any long random string, for hashed abuse logging |
   | `CF_ACCOUNT_ID` | `9c17edb50bf42a236245b52f9a323953` |
   | `EMAIL_API_TOKEN` | API token with **Email Sending: Edit** |
   | `FROM_EMAIL` | an address on your onboarded sending domain |
   | `FROM_NAME` | e.g. `Feeding the Flock SD` |
   | `ACCESS_TEAM_DOMAIN` | **required** — e.g. `feedingtheflock.cloudflareaccess.com` |
   | `ACCESS_AUD` | **required** — the export app's Application Audience tag |
   | `ACCESS_ALLOWED_EMAILS` | optional second gate, comma-separated |

   The email ones degrade safely — leave any of `CF_ACCOUNT_ID`,
   `EMAIL_API_TOKEN`, or `FROM_EMAIL` unset and no confirmation is sent, but
   signups still save and are marked `Email not set up` in the CSV. The two
   `ACCESS_*` variables and `TURNSTILE_SECRET` are **not** optional: without
   the first two `/api/export` refuses every request, and without the third
   `/api/signup` does. Both are deliberate — a missing secret must never
   silently downgrade a protection. `TURNSTILE_SECRET` is skipped only on
   `localhost`, so `wrangler pages dev` still works without it.

5. **Protect the export** (step 6 below). Until you do, the CSV endpoint returns
   500 to everyone, including you. Signups work fine in the meantime.

## Upgrading an existing database

`schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so re-running it will **not**
add the new column to a table that already exists. If you applied an earlier
version, run this once instead:

```bash
npx wrangler d1 execute ftf-signups --remote --command "
ALTER TABLE signups ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';
ALTER TABLE signups ADD COLUMN email_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE signups ADD COLUMN email_error TEXT;
CREATE TABLE IF NOT EXISTS period_stats (
  period TEXT PRIMARY KEY, signups INTEGER NOT NULL,
  families INTEGER NOT NULL, archived_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);"
```

Existing rows become `lang = 'en'`, which is the right default for anything
signed up before the column existed.

**This has already been applied to the live `ftf-signups` database** (2026-09-01).
It's here for a rebuild or a second environment.

## Getting the list out

`/api/export` is behind Cloudflare Access. There is no shared token to leak,
rotate, or text to a new board member.

**Set it up once:** Zero Trust → Access → Applications → Add a self-hosted
application covering `your-domain/api/export*`. Add a policy: Action *Allow*,
Include → *Emails*, and list the four board addresses. Then copy the
**Application Audience (AUD) tag** from the app's Overview into the
`ACCESS_AUD` variable, and your team domain into `ACCESS_TEAM_DOMAIN`.

After that the secretary just opens the URL in a browser, signs in with her own
email, and the CSV downloads:

```
https://your-domain/api/export?period=2026-10
```

Opens straight into Sheets or Excel (BOM included so accented names survive).

**Why the Worker checks the token too.** An Access policy protects a *hostname*.
Your Pages project also answers on `ftf-signup.pages.dev`, which the policy does
not cover — so `lib/access.js` independently verifies the signed JWT that Access
forwards. Both gates, or the origin is an open door.

**Why it fails closed.** The old `ADMIN_TOKEN` check was written as
`if (env.ADMIN_TOKEN)`. If that secret was ever unset, renamed, or mistyped, the
check was skipped entirely and every family's name and email was a public
download with no error anywhere. The Access check refuses instead: a
misconfiguration now breaks the CSV for the board, loudly, rather than opening
it to everyone, silently. If you get a 500 from this endpoint, the two
`ACCESS_*` variables are the first thing to check.

`ADMIN_TOKEN` is no longer read by any code. Delete it from the Pages
environment.

## Capping or closing a month

```sql
INSERT INTO periods (period, capacity, is_open) VALUES ('2026-10', 150, 1);
UPDATE periods SET is_open = 0, note = 'Signups closed for October.'
  WHERE period = '2026-10';
```

With no row for a month, the form is open and uncapped.

## Retention

**Personal data is deleted after 12 months.** Before the delete, each month's
totals are copied into `period_stats` and kept forever — so "how many families
did we serve in 2025" still answers, without keeping anyone's name to answer it.

Pages Functions have no cron trigger, so the sweep runs opportunistically from
`/api/signup` and `/api/export`, guarded by a `last_purge` row so it does real
work at most once a day. Both call it through `waitUntil`: a purge failure can
never affect a family signing up or the board pulling a CSV.

The catch: a month with **zero** signups and zero exports never triggers a
sweep. In practice the board pulls a CSV monthly and that's enough. If you'd
rather not depend on that, either run it by hand —

```bash
npx wrangler d1 execute ftf-signups --remote --command \
  "DELETE FROM signups WHERE period < '2025-10';"
```

— or move this project to a Worker with a `[triggers]` cron, which is the only
way to get a guaranteed schedule. `purgeExpired()` in `lib/retention.js` is
already the whole job; a `scheduled()` handler would just call it.

To change the window, edit `RETENTION_MONTHS` in `lib/retention.js`.

## Decided, so you don't re-litigate it

- **Email is the identity key.** Considered switching to phone number, which
  survives families who share or lack an address. Decided against: these
  families reliably have their own email, and email is also how the confirmation
  reaches them. Revisit only if you start seeing people who genuinely cannot
  sign up — the fix is to swap `email_norm` for a normalized phone in the unique
  index and make email optional, and it gets expensive once the table has rows.
- **"# of families" is capped at 10** in both the form and the API. Change
  `MAX_FAMILIES` in `signup.js` and the `max` attribute in `index.html`
  together.
- **Retention is 12 months**, counts kept forever.

## Known sharp edges

- The capacity check reads the running total and then inserts, so two signups
  landing in the same millisecond could together overshoot the cap by a few
  families. At this volume it isn't worth a transaction; the board can close the
  month by hand if it matters.
- `periods.note` is rendered as text, not HTML, so it can't inject anything —
  but it is shown to families verbatim, so write it carefully.
