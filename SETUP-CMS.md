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

| Dashboard section | File |
| --- | --- |
| Site Settings → Site Details | `src/data/site.json` |
| Site Settings → Impact Stats | `src/data/impact.json` |
| Content → Programs | `src/content/programs.json` |
| Content → Locations | `src/content/locations.json` |
| Content → Partners | `src/content/partners.json` |
| Content → Gallery Photos | `src/content/gallery.json` |
| Content → Events | `src/content/events.json` |

Notes for editors:

- **ID fields** must stay unique and use `lowercase-hyphen` form (no spaces).
  They key the content internally — changing one is like renaming the item.
- **Order** controls the display order on the page (lowest first).
- **Images**: use the picker to choose an existing image or upload a new one.
  New uploads are committed under `public/images/`. When adding gallery photos in
  bulk, dropping the files into `public/images/photos/` in Git first keeps them
  tidily grouped.
- **Events** come in three kinds — *Weekly*, *Monthly (Nth weekday)*, and
  *Specific dates* — chosen when you add an event. Weekday is `0`=Sunday …
  `6`=Saturday.
