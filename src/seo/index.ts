/**
 * TechConf-specific SEO helpers.
 *
 * Pages compute their JSON-LD via these wrappers around
 * `@chimi/design-system/seo`. The home/listing emits an ItemList of
 * Event objects (one per upcoming conference) so search engines can
 * surface the calendar directly. Past/insights pages emit a WebPage.
 */

// @ts-expect-error - .mjs subpath, types provided by JSDoc in DS
import { buildJsonLd } from "@chimichurricode/design-system/seo";
import { homeEditorialJsonLd } from "@chimichurricode/web-app-kit/seo";

interface ConferenceData {
  name: string;
  website?: string;
  location: string;
  dateStart: string;
  dateEnd: string;
  cancelled?: boolean;
}

/**
 * Build an `Event` JSON-LD block for a single conference. Used by the
 * home and past listings via the home/list dispatcher.
 */
export function conferenceEventJsonLd(conference: ConferenceData): Record<string, unknown> {
  return buildJsonLd({
    kind: "event",
    siteId: "techconf",
    data: {
      name: conference.name,
      startDate: conference.dateStart,
      endDate: conference.dateEnd,
      url: conference.website,
      locationName: conference.location,
      eventStatus: conference.cancelled
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    },
  }) as Record<string, unknown>;
}

/**
 * Build the home JSON-LD: WebSite + Organization (TechConf as
 * publisher) + an ItemList of upcoming events.
 *
 * Post-C2: WebSite + Organization composition delegated to
 * `homeEditorialJsonLd` from the kit. The ItemList is
 * domain-specific (TechConf is the only consumer that emits one) and
 * stays here.
 */
export function homeJsonLd(upcoming: ConferenceData[]): Array<Record<string, unknown>> {
  const websiteAndOrg = homeEditorialJsonLd({
    siteId: "techconf",
    socials: ["https://github.com/npatarino/tech-conferences-spain"],
  });

  const itemList: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Próximas conferencias técnicas en España",
    itemListElement: upcoming.slice(0, 25).map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: conferenceEventJsonLd(c),
    })),
  };

  return [...websiteAndOrg, itemList];
}

/**
 * WebPage JSON-LD for utility pages (insights, past, calendar, map).
 */
export function pageJsonLd(input: {
  name: string;
  description: string;
  url: string;
}): Record<string, unknown> {
  return buildJsonLd({
    kind: "webpage",
    siteId: "techconf",
    data: input,
  }) as Record<string, unknown>;
}

/**
 * Build an ItemList JSON-LD wrapping a collection of conferences as Events.
 * Used by the past listings to expose recent history as structured data.
 */
export function conferenceListJsonLd(input: {
  name: string;
  conferences: ConferenceData[];
  limit?: number;
}): Record<string, unknown> {
  const limit = input.limit ?? 50;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListElement: input.conferences.slice(0, limit).map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: conferenceEventJsonLd(c),
    })),
  };
}
