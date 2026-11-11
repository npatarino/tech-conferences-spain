/**
 * Feed discovery: adds the `<link rel="alternate">` tags to every page's
 * `<head>` so OTE tools (and calendar apps) can find the feeds on their
 * own, the way RSS readers do.
 *
 * Done here because the `<head>` is owned by
 * `@chimichurricode/web-app-kit/BaseLayout.astro`, which has no head slot.
 * The site is static, so this runs once per page at build time. Replace
 * with a slot/prop if the kit ever grows one.
 */
import { defineMiddleware } from "astro:middleware";
import { OTE_FEED_PATH, OTE_ICS_PATH, OTE_MEDIA_TYPE } from "./lib/ote.ts";

const DISCOVERY_LINKS =
  `<link rel="alternate" type="${OTE_MEDIA_TYPE}" href="${OTE_FEED_PATH}" title="TechConf — feed OpenTechEvents">` +
  `<link rel="alternate" type="text/calendar" href="${OTE_ICS_PATH}" title="TechConf — calendario (iCalendar)">`;

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const html = await response.text();
  return new Response(html.replace("</head>", `${DISCOVERY_LINKS}</head>`), {
    status: response.status,
    headers: response.headers,
  });
});
