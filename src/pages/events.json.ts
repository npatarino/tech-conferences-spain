/**
 * OTE feed — https://techconf.es/events.json
 *
 * Every edition in `content/conferences/`, as an OpenTechEvents v0.6 feed.
 * Mapping lives in `src/lib/ote.ts`; CORS headers in `vercel.json`.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildOteFeed } from "../lib/ote.ts";

export const GET: APIRoute = async () => {
  const entries = await getCollection("conferences");
  const feed = buildOteFeed(
    entries.map((e) => ({ id: e.id, ...e.data })),
    new Date(),
  );
  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
