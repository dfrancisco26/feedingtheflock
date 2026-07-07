# Changelog

All notable changes to the Feeding the Flock SD website are recorded here.
Newest entries first. Dates are in `YYYY-MM-DD`.

This log tracks the migration from the original static HTML site to an Astro
project with a modular content model, an admin dashboard, and a photo gallery.
See the phased plan for the full roadmap.

## [Unreleased] — `astro-migration` branch

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

- **Phase 3** — Extract content (copy, events, tally, partners, gallery) into
  Astro content collections; set up Cloudinary and migrate photos out of the repo.
- **Phase 4** — Wide gallery album with optimized thumbnails and a React
  lightbox island.
- **Phase 5** — Admin dashboard (Git-based CMS) with GitHub OAuth login.
