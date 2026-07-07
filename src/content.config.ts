import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

// Each collection is a single JSON array; every item needs a unique `id`.
// `order` controls display order on the page (ascending).

const programs = defineCollection({
  loader: file("src/content/programs.json"),
  schema: z.object({
    order: z.number().default(0),
    title: z.string(),
    description: z.string(),
    points: z.array(z.string()).default([]),
  }),
});

const locations = defineCollection({
  loader: file("src/content/locations.json"),
  schema: z.object({
    order: z.number().default(0),
    title: z.string(),
    description: z.string(),
    points: z.array(z.string()).default([]),
  }),
});

const partners = defineCollection({
  loader: file("src/content/partners.json"),
  schema: z.object({
    order: z.number().default(0),
    name: z.string(),
    logo: z.string(),
  }),
});

const gallery = defineCollection({
  loader: file("src/content/gallery.json"),
  schema: z.object({
    order: z.number().default(0),
    src: z.string(),
    alt: z.string(),
  }),
});

const events = defineCollection({
  loader: file("src/content/events.json"),
  schema: z.discriminatedUnion("type", [
    // Recurs every week on `weekday` (0 = Sunday ... 6 = Saturday).
    z.object({
      type: z.literal("weekly"),
      title: z.string(),
      time: z.string(),
      description: z.string(),
      weekday: z.number().min(0).max(6),
    }),
    // Recurs on the Nth `weekday` of each month (e.g. 4th Wednesday).
    z.object({
      type: z.literal("monthlyNthWeekday"),
      title: z.string(),
      time: z.string(),
      description: z.string(),
      weekday: z.number().min(0).max(6),
      nth: z.number().min(1).max(5),
    }),
    // Occurs on specific calendar dates (YYYY-MM-DD).
    z.object({
      type: z.literal("dates"),
      title: z.string(),
      time: z.string(),
      description: z.string(),
      dates: z.array(z.string()),
    }),
  ]),
});

export const collections = { programs, locations, partners, gallery, events };
