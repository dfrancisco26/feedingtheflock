# Changelog

All notable changes to the Feeding the Flock SD website are recorded here.
Newest entries first. Dates are in `YYYY-MM-DD`.

This log tracks the migration from the original static HTML site to an Astro
project with a modular content model, an admin dashboard, and a photo gallery.
See the phased plan for the full roadmap.

## [Unreleased] — `astro-migration` branch

### Phase 5 — Admin dashboard (Sveltia CMS) (2026-07-08)

Added a Git-based content-management dashboard so non-technical editors can
update the site through forms — no code, no database. This is the final planned
phase of the migration.

- **Added** `/admin/` — [Sveltia CMS](https://github.com/sveltia/sveltia-cms)
  (a modern Decap/Netlify CMS successor), loaded from
  `public/admin/index.html`.
- **Added** `public/admin/config.yml` mapping every content file to an editor
  form: `site.json` and `impact.json` under **Site Settings**, and `programs`,
  `locations`, `partners`, `gallery`, and `events` under **Content**. Top-level
  JSON arrays use the List widget's `root: true`; events use variable types
  keyed on `type`. Field order mirrors the existing JSON so edits produce clean
  diffs, and the config's fields were verified to cover every key so nothing is
  dropped on save.
- **Auth**: GitHub OAuth through a Cloudflare Worker relay (`sveltia-cms-auth`);
  each save commits to `main` and triggers a deploy. `local_backend: true` also
  allows editing against the local working copy with no login.
- **Added** `SETUP-CMS.md` — one-time OAuth App + Worker setup plus an editor
  guide.
- **Tuned for non-technical editors**: internal `id` fields are hidden and
  auto-generated (`{{uuid_shorter}}`); events use plain-language pickers (day-of-
  week and occurrence dropdowns, a calendar date picker) instead of numeric
  codes; friendly labels and hints throughout; the sidebar leads with the
  most-used sections (Events, Photos, Impact Numbers).
- **Removed the explicit `order` field** from the `programs`, `locations`,
  `partners`, and `gallery` collections (data, schemas, and page sorts).
  Display order now follows the order of items in each file, which the dashboard
  controls by drag-and-drop — verified that Astro's `file()` loader preserves
  array order.

### Phase 4 — Wide gallery album + React lightbox (2026-07-07)

Added a dedicated photo gallery with a full-screen viewer. This introduces the
first **React island** in the project (the "React" part of the Astro + React
islands architecture).

- **Added** `@astrojs/react` and React 19; registered the integration in
  `astro.config.mjs`.
- **Added** `/gallery.html` (`src/pages/gallery.astro`) — a wide, full-bleed
  masonry album (CSS columns, responsive 4 → 1) that renders every album photo
  from `gallery.json` with lazy-loaded images.
- **Added** `src/islands/Lightbox.tsx` — a React island hydrated `client:idle`:
  full-screen viewer with previous/next, keyboard nav (←/→/Esc), caption,
  counter, and body scroll-lock. Progressive enhancement — with JS disabled, the
  album photos link straight to the image files.
- **Expanded** `gallery.json` from 6 to 25 photos: every image in
  `public/images/photos/` except the 9 already used as page heroes/splits.
  **Alt text for the 19 newly added photos is provisional** and should be
  reviewed against the actual images for accuracy.
- **Added** "Gallery" to the header and footer navigation.
- **Updated** the About page gallery to a 6-photo teaser with a "View all
  photos" link to `/gallery.html`.
- **Added** album + lightbox styles to `global.css`.

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

## Roadmap

All five planned phases are complete. Before the `astro-migration` branch merges
to `main`, two items still need a human:

- **Review the gallery alt text** — the 19 photos added in Phase 4 have
  provisional descriptions (editable in the new dashboard under Content →
  Gallery Photos).
- **Complete the CMS one-time auth setup** — create the GitHub OAuth App and
  deploy the auth Worker, then set `base_url` in `public/admin/config.yml`
  (see `SETUP-CMS.md`).

Image hosting on Cloudinary is deferred; photos stay in `public/images/` and are
optimized/compressed manually for now.
