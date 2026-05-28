import { defineCollection, z } from "astro:content";
import { conferencesLoader } from "./loaders/conferences.ts";

const conferences = defineCollection({
  loader: conferencesLoader(),
  schema: z.object({
    name: z.string(),
    website: z.string().optional(),
    twitter: z.string().optional(),
    location: z.string(),
    dateStart: z.string(),
    dateEnd: z.string(),
    dateTbc: z.boolean().default(false),
    cancelled: z.boolean().default(false),
    cfpStart: z.string().optional(),
    cfpEnd: z.string().optional(),
    cfpSite: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
});

export const collections = { conferences };
