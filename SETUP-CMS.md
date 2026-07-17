Admin Dashboard (CMS) Setup
===========================

The site includes a Git-based admin dashboard at **`/admin/`**, powered by
[Sveltia CMS](https://github.com/sveltia/sveltia-cms). Editors log in with
GitHub and change site content through forms; every save becomes a commit on the
`main` branch, which triggers a normal Cloudflare Pages deploy. There is **no
separate database** — the content files under `src/data/` and `src/content/` are
the source of truth.

- Admin URL (production): `https://feedingtheflocksd.org/admin/`
- Config: [public/admin/config.yml](public/admin/config.yml)
- Entry page: [public/admin/index.html](public/admin/index.html)

Because login uses GitHub OAuth and Cloudflare Pages can't run the OAuth
handshake by itself, there is a small **one-time setup** below. Until it's done,
the dashboard loads but "Login with GitHub" won't complete.

> Prefer to edit locally with no login? Skip to [Local editing](#local-editing).

---

One-time setup (production login)
---------------------------------

You need two things: a **GitHub OAuth App** and a tiny **Cloudflare Worker** that
completes the login handshake. Budget ~15 minutes.

### 1. Deploy the auth worker

The worker is a ready-made project:
<https://github.com/sveltia/sveltia-cms-auth>.

1. Open that repo and use its **"Deploy to Cloudflare Workers"** button (or clone
   it and run `npx wrangler deploy`).
2. After deploy, note the worker URL, e.g.
   `https://sveltia-cms-auth.<your-subdomain>.workers.dev`.

Leave its environment variables for step 3 — you need the GitHub app first.

### 2. Create the GitHub OAuth App

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
(<https://github.com/settings/developers>):

| Field | Value |
| --- | --- |
| Application name | `Feeding the Flock CMS` |
| Homepage URL | `https://feedingtheflocksd.org` |
| Authorization callback URL | `https://sveltia-cms-auth.<your-subdomain>.workers.dev/callback` |

Click **Register application**. Copy the **Client ID**, then **Generate a new
client secret** and copy it (you won't see it again).

### 3. Add the secrets to the worker

In the Cloudflare dashboard → your worker → **Settings → Variables**, add:

| Variable | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | the Client ID from step 2 |
| `GITHUB_CLIENT_SECRET` | the client secret (click **Encrypt**) |
| `ALLOWED_DOMAINS` | `feedingtheflocksd.org,*.feedingtheflock.pages.dev` (optional but recommended — restricts who can use the relay) |

Redeploy the worker if prompted.

### 4. Point the CMS at the worker

In [public/admin/config.yml](public/admin/config.yml), set `base_url` under
`backend` to your worker URL (no trailing slash, no `/callback`):

```yaml
backend:
  name: github
  repo: dfrancisco26/feedingtheflock
  branch: main
  base_url: https://sveltia-cms-auth.<your-subdomain>.workers.dev
```

Commit and let the site deploy. Then visit `https://feedingtheflocksd.org/admin/`
and click **Login with GitHub**. Anyone who should edit must have **push access**
to the `dfrancisco26/feedingtheflock` repo.

---

Local editing
-------------

You can run the dashboard against your local working copy with **no GitHub login
and no worker** — handy for bulk edits (e.g. fixing gallery alt text):

```bash
# terminal 1 — the proxy that reads/writes your local files
npx @sveltia/cms-proxy-server      # (or: npx decap-server)

# terminal 2 — the site dev server
npm run dev
```

Then open <http://localhost:4321/admin/index.html>. The `local_backend: true`
line in `config.yml` tells the CMS to use the proxy. Saves write straight to the
files on disk (no commit); review and commit them with Git as usual.

---

What's editable
---------------

The dashboard sidebar has these sections:

| Dashboard section | What it controls | File |
| --- | --- | --- |
| **Events / Calendar** | Events shown on the calendar | `src/content/events.json` |
| **Photos** | Gallery photos | `src/content/gallery.json` |
| **Impact Numbers** | The three homepage stats | `src/data/impact.json` |
| **Site Details** | Org info, donation methods, contacts | `src/data/site.json` |
| **About Page** | Programs, locations, partner logos | `src/content/*.json` |

The dashboard is built for non-technical editors:

- **No ID or "order" fields.** Internal IDs are created automatically and stay
  hidden. To change the order of things (photos, programs, locations, partners),
  just **drag the items up or down** — the page follows that order.
- **Adding an event**: click **Add**, then pick how it repeats —
  *every week*, *monthly (e.g. the 4th Wednesday)*, or *on specific date(s)*.
  The day of the week is a plain dropdown, and specific dates use a calendar
  picker. No codes to remember.
- **Adding a photo**: click **Add**, choose or upload the image, and write a
  short description of what's in it (this is read aloud by screen readers, so
  describe the scene simply). New uploads are committed under `public/images/`.
- **Publishing**: every save commits to GitHub and the site redeploys
  automatically — usually live within a minute or two.
- The one place an ID is visible is **Site Details → Payment methods**, where a
  small "ID (do not change)" field links each button to its QR code. Leave it
  alone unless you're adding a brand-new payment method.
