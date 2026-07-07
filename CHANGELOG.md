# Changelog

All notable changes to the Feeding the Flock SD website are recorded here.
Newest entries first. Dates are in `YYYY-MM-DD`.

This log tracks the migration from the original static HTML site to an Astro
project with a modular content model, an admin dashboard, and a photo gallery.
See the phased plan for the full roadmap.

## [Unreleased] — `astro-migration` branch

### Phase 3 — Content collections (2026-07-07)

Separated content from markup. Copy, events, impact numbers, programs,
locations, partners, and gallery photos now live in structured, schema-validated
data files; the pages render from them. This is the single-source-of-truth
groundwork for the Phase 5 admin dashboard. No visual change intended.

- **Added** `src/content.config.ts` defining five zod-validated collections via
  Astro's `file()` loader: `programs`, `locations`, `partners`, `gallery`, and
  `events` (a discriminated union over `weekly` / `monthlyNthWeekday` / `dates`).
- **Added** singletons in `src/data/`:
  - `site.json` — org name, EIN, nonprofit disclosure, logo, email, address,
    social links, food-box form URL, donation methods (with an `enabled` flag),
    check details, and the leadership roster.
  - `impact.json` — the home page tally (eyebrow, heading, and the three stats).
- **Added** collection data in `src/content/`: `programs.json` (6),
  `locations.json` (4), `partners.json` (5), `gallery.json` (6), `events.json` (6).
- **Added** `src/components/PointsCard.astro`, shared by the Programs and
  Locations sections (title + paragraph + bullet list).
- **Rewired pages to render from data:**
  - `about.astro` — Programs, Locations, Partners, and Gallery map over their
    collections.
  - `index.astro` — impact section from `impact.json`; footer contact block from
    `site.json`.
  - `contact.astro` — social links, org block, and leadership roster from `site.json`.
  - `donate.astro` — payment cards and check details from `site.json`; only
    methods with `enabled: true` render (this replaces the commented-out Zelle
    block — set `enabled: true` to bring it back).
  - `Header.astro` / `Footer.astro` — logo, org name, and disclosure from `site.json`.
- **Client scripts now read injected JSON data islands** instead of hard-coded
  arrays:
  - `events.astro` emits a `data-calendar-data` island (events +
    food-box URL); `events-calendar.js` reads it (`expandEvents` now takes the
    sources as an argument).
  - `donate.astro` emits a `data-donation-options` island; `donation-modal.js`
    reads it.

Data inconsistencies surfaced while extracting content (preserved as-is; confirm
which is correct):

- Org mailing address is `8746 Delta St`, but the "mail a check" address is
  `8764 Delta St`.
- The Senior Coordinator email was displayed as `demar1@cox.net` but linked to
  `demars1@cox.net`; both now use the linked `demars1@cox.net`.

### Phase 2 — Astro scaffold + page port (2026-07-07)

Migrated the hand-built multi-page site to **Astro** with static output. The
site looks and behaves the same; the structure underneath is now componentized.

- **Added** Astro toolchain: `package.json`, `astro.config.mjs`, `tsconfig.json`.
  - `build.format: "file"` keeps existing URLs (`about.html`, `donate.html`, …)
    so no inbound links or bookmarks break.
  - `site` set to `https://feedingtheflocksd.org` for absolute social/canonical
    URLs. **TODO:** confirm the production domain.
- **Added** `src/layouts/BaseLayout.astro` — single source of truth for `<head>`,
  including a favicon and Open Graph + Twitter Card meta on every page (these
  were previously missing).
- **Added** `src/components/Header.astro` and `Footer.astro`, replacing the
  runtime JS injection (`header.js` / `footer.js` / `main.js`). Nav and footer
  markup now render server-side at build time.
- **Ported** all five pages to `src/pages/*.astro` (`index`, `about`, `events`,
  `donate`, `contact`). Content is unchanged from the original HTML.
- **Moved** assets into the Astro layout:
  - `images/` → `public/images/` (so `/images/...` URLs keep resolving).
  - `assets/css/styles.css` → `src/styles/global.css` (imported by the layout).
  - `assets/js/{tally,donation-modal,events-calendar}.js` → `src/scripts/`
    (bundled and run from the layout; each still no-ops when its markup is absent).
- **Removed** `assets/js/{header,footer,main}.js` — superseded by Astro components.
- **Fixed** inconsistent image paths on the contact page (relative `images/...`
  → absolute `/images/...`), matching the rest of the site.
- **Verified** `npm run build` completes and emits all five pages with rendered
  header/footer, correct active-nav state, populated `<head>`, and all
  referenced assets present in `dist/`.

### Phase 1 — Cleanup (2026-07-07)

- **Removed** stray browser "Save As" artifacts committed under `images/`
  (`My Styles _ Retro Diffusion.html` and its `_files/` folder).
- **Added** `.gitignore` covering `.DS_Store`, `node_modules/`, `dist/`,
  `.astro/`, and env files.
- **Untracked** the `.DS_Store` files that were previously committed.

### Notes / follow-ups

- The first Astro build was slow (~2.8 min) because it ran on a cold cache right
  after recovering from a full disk; subsequent builds should be much faster.
- **Cloudflare Pages** build settings must be updated before this branch is
  promoted to production: set **Build command** to `npm run build` and **Build
  output directory** to `dist`. Until then, `main` continues to deploy the
  original static site unchanged.

## Roadmap (not yet started)

- **Phase 4** — Wide gallery album with optimized thumbnails and a React
  lightbox island, rendered from the `gallery` collection.
- **Phase 5** — Admin dashboard (Git-based CMS) with GitHub OAuth login, editing
  the `src/content` and `src/data` files.

Image hosting on Cloudinary is deferred; photos stay in `public/images/` and are
optimized/compressed manually for now.
