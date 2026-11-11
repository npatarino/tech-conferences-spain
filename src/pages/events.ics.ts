/**
 * iCalendar export of the OTE feed — https://techconf.es/events.ics
 *
 * Derived from the same feed object as `/events.json`, so the two cannot
 * drift apart.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { feedToIcs } from "@opentechevents/export-ics";
import { buildOteFeed } from "../lib/ote.ts";

export const GET: APIRoute = async () => {
  const entries = await getCollection("conferences");
  const feed = buildOteFeed(
    entries.map((e) => ({ id: e.id, ...e.data })),
    new Date(),
  );
  return new Response(feedToIcs(feed as Parameters<typeof feedToIcs>[0]), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
};
