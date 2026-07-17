Feeding the Flock SD Website
============================

Marketing site for Feeding the Flock SD, a 501(c)(3) nonprofit. Built with
[Astro](https://astro.build/) — static HTML with small [React](https://react.dev/)
islands for interactivity — and deployed on Cloudflare Pages.

> Migrating from the original hand-built HTML site to Astro. See
> [`CHANGELOG.md`](CHANGELOG.md) for what has changed and what is planned.

Requirements
------------

- Node.js 18+ (developed on Node 22)
- npm

Getting Started
---------------

```bash
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:4321
npm run build     # build the static site into dist/
npm run preview   # preview the production build locally
```

Project Structure
-----------------

```
public/
  images/              Static images, served at /images/... (logos, photos, QR codes)
src/
  data/                Site-wide singletons (imported directly)
    site.json          Org info, socials, donation methods, form URL, contacts
    impact.json        Home page tally (headings + the three stats)
  content/             Content collections (schema-validated data)
    programs.json      About > Programs
    locations.json     About > Locations
    partners.json      About > Partners (logos)
    gallery.json       About > Gallery (also the base for the Phase 4 album)
    events.json        Events calendar sources (recurrence-aware)
  content.config.ts    Collection definitions + zod schemas
  layouts/
    BaseLayout.astro   <head> (meta, favicon, Open Graph), header/footer, shared scripts
  components/
    Header.astro       Site header + primary nav (active state per page)
    Footer.astro       Footer with nonprofit disclosure + nav
    PointsCard.astro   Reusable card (title + paragraph + bullets) for Programs/Locations
  islands/             Interactive React components (hydrated on the client)
    Lightbox.tsx       Full-screen photo viewer for the gallery
  pages/               One file per route (build.format "file" => /about.html, etc.)
    index.astro        Home
    about.astro        About: story, programs, locations, partners, gallery teaser
    gallery.astro      Wide photo album (masonry) + React lightbox
    events.astro       Food Help & Events: upcoming events + monthly calendar
    donate.astro       Donation methods + QR modal
    contact.astro      Contact info and social links
  scripts/             Client-side behavior, run from BaseLayout (each self-guards)
    tally.js           Animated impact counters (home)
    donation-modal.js  Donate page QR modal (reads a JSON data island)
    events-calendar.js Calendar/upcoming rendering (reads a JSON data island)
  styles/
    global.css         Global styles for all pages
astro.config.mjs       Astro config (site URL, file-based output)
```

How It Works
------------

- **Pages** are `.astro` files that wrap their content in `BaseLayout`. Each page
  passes `title`, `description`, and `page` (the active nav key) to the layout.
- **Header and footer** render at build time from `Header.astro` / `Footer.astro`.
  The active nav item is set by the `page` prop (`home`, `about`, `events`,
  `donate`, `contact`).
- **URLs are preserved** from the original site via `build.format: "file"` in
  `astro.config.mjs`, so pages build to `about.html`, `donate.html`, etc.
- **Interactive scripts** (`src/scripts/`) are imported once in `BaseLayout` and
  bundled by Astro. Each init function no-ops when its markup is not on the page,
  so it is safe to load them everywhere.

Editing Content
---------------

Most editable content now lives in data files, separate from the page markup.
Until the admin dashboard lands (Phase 5), edit these files directly:

- **Org info, socials, donation methods, food-box form link, contacts** —
  `src/data/site.json`.
- **Impact numbers** — `src/data/impact.json`.
- **Events** — `src/content/events.json` (each entry is `weekly`,
  `monthlyNthWeekday`, or `dates`).
- **Programs / Locations / Partners / Gallery** — the matching file in
  `src/content/`.
- **Photos** — add the file under `public/images/photos/`, then reference it from
  `src/content/gallery.json` (or the relevant page).

Schemas for the collections live in `src/content.config.ts`; the build fails
with a clear error if a data file does not match its schema.

Narrative/hero copy that is specific to a single page still lives inline in that
page's `.astro` file.

Deployment
----------

Hosted on **Cloudflare Pages**, deploying from GitHub.

> **Before merging this branch to `main`:** update the Cloudflare Pages project so
> it builds the Astro site instead of serving raw files.
>
> - **Build command:** `npm run build`
> - **Build output directory:** `dist`
>
> While `main` still holds the original static HTML, the live site keeps
> deploying as-is; the Astro migration lives on the `astro-migration` branch.

Also confirm the production domain in `astro.config.mjs` (`site`) so Open Graph
and canonical URLs are correct.

Roadmap
-------

- **Phase 5** — Admin dashboard via a Git-based CMS with GitHub login, editing
  the files under `src/content/` and `src/data/`.

Image hosting on Cloudinary is deferred; photos stay in `public/images/` for now.

See [`CHANGELOG.md`](CHANGELOG.md) for detailed history.
