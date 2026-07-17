// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // Used to build absolute URLs for Open Graph / social tags and sitemaps.
  // TODO: confirm the production domain and update if different.
  site: "https://feedingtheflocksd.org",

  // Emit page.html files (about.html, donate.html, ...) instead of
  // directory-style clean URLs, preserving the site's existing URLs.
  build: {
    format: "file",
  },
});
