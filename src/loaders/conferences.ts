import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { Loader } from "astro/loaders";
import { parseFrontmatter } from "../lib/frontmatter.ts";
import { geocode } from "../lib/geocode.ts";

const CONTENT_DIR = resolve(process.cwd(), "content/conferences");

function toIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? value : undefined;
}

export function conferencesLoader(): Loader {
  return {
    name: "conferences",
    load: async ({ store, parseData, generateDigest, logger }) => {
      store.clear();
      let count = 0;

      const dirs = await readdir(CONTENT_DIR, { withFileTypes: true });
      for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        const dirPath = join(CONTENT_DIR, dir.name);
        const files = await readdir(dirPath);
        for (const file of files) {
          if (!file.endsWith(".md")) continue;
          const filePath = join(dirPath, file);
          let raw: string;
          try {
            raw = await readFile(filePath, "utf-8");
          } catch {
            continue;
          }
          const st = await stat(filePath);
          if (!st.isFile()) continue;

          const { fm } = parseFrontmatter(raw);

          const dateStart = toIsoDate(fm.date_start);
          const dateEnd = toIsoDate(fm.date_end) ?? dateStart;
          if (!dateStart) continue;

          const id = file.replace(/\.md$/, "");
          const location = typeof fm.location === "string" ? fm.location : "";

          // Include geocoding capability in the digest so that adding or
          // removing GOOGLE_MAPS_API_KEY invalidates cached entries and
          // triggers a fresh geocoding pass on the next build.
          const geocodeSlot = process.env.GOOGLE_MAPS_API_KEY ? "geo:1" : "geo:0";
          const coords = location ? await geocode(location) : null;

          const data = await parseData({
            id,
            data: {
              name: String(fm.name ?? id),
              website: typeof fm.website === "string" ? fm.website : undefined,
              twitter: typeof fm.twitter === "string" ? fm.twitter : undefined,
              location,
              dateStart,
              dateEnd: dateEnd ?? dateStart,
              dateTbc: fm.date_tbc === true,
              cancelled: fm.cancelled === true,
              cfpStart: toIsoDate(fm.cfp_start),
              cfpEnd: toIsoDate(fm.cfp_end),
              cfpSite: typeof fm.cfp_site === "string" ? fm.cfp_site : undefined,
              lat: coords?.lat,
              lng: coords?.lng,
            },
          });

          store.set({
            id,
            data,
            digest: generateDigest(raw + geocodeSlot),
            filePath: relative(process.cwd(), filePath),
          });
          count++;
        }
      }

      logger.info(`Loaded ${count} conferences`);
    },
  };
}
