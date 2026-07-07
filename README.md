Feeding the Flock SD Website
============================

Marketing site for Feeding the Flock SD, a 501(c)(3) nonprofit. Built with
[Astro](https://astro.build/) and deployed as a static site on Cloudflare Pages.

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
  layouts/
    BaseLayout.astro   <head> (meta, favicon, Open Graph), header/footer, shared scripts
  components/
    Header.astro       Site header + primary nav (active state per page)
    Footer.astro       Footer with nonprofit disclosure + nav
  pages/               One file per route (build.format "file" => /about.html, etc.)
    index.astro        Home
    about.astro        About: story, programs, locations, partners, gallery
    events.astro       Food Help & Events: upcoming events + monthly calendar
    donate.astro       Donation methods + QR modal
    contact.astro      Contact info and social links
  scripts/             Client-side behavior, run from BaseLayout (each self-guards)
    tally.js           Animated impact counters (home)
    donation-modal.js  Donate page QR modal
    events-calendar.js Events data + calendar/upcoming rendering
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

Editing Content (for now)
-------------------------

Content currently lives inside the `.astro` pages and script files. Until the
content collections and admin dashboard land (Phases 3 and 5), edits are made in
code:

- **Events** — `src/scripts/events-calendar.js` (`eventSources` array).
- **Food box request link** — `foodBoxFormUrl` in `src/scripts/events-calendar.js`.
- **Impact numbers** — `data-target` attributes in `src/pages/index.astro`.
- **Donation links / QR codes** — `src/pages/donate.astro` and
  `src/scripts/donation-modal.js`.
- **Photos** — files in `public/images/photos/`, referenced from the pages.

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

- **Phase 3** — Move content into Astro content collections; migrate photos to
  Cloudinary.
- **Phase 4** — Wide gallery album with optimized images and a lightbox.
- **Phase 5** — Admin dashboard via a Git-based CMS with GitHub login.

See [`CHANGELOG.md`](CHANGELOG.md) for detailed history.
