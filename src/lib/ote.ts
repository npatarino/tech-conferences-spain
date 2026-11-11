/**
 * OpenTechEvents (OTE) export — https://opentechevents.org
 *
 * Maps the conference collection to an OTE Spec v0.6 feed. The Markdown
 * files in `content/conferences/` stay the source of truth: OTE asks for
 * JSON at the published URL, not in the authoring format.
 *
 * Pure functions, no I/O: the endpoints in `src/pages/` feed them the
 * collection and serialise the result.
 */

export const OTE_SPEC_VERSION = "0.6.0";
export const OTE_MEDIA_TYPE = "application/ote+json";
export const OTE_FEED_PATH = "/events.json";
export const OTE_ICS_PATH = "/events.ics";

/**
 * Base of every `id` minted here. OTE ids are written once and never
 * rewritten (consumers use them to update an event instead of duplicating
 * it), so this is a constant on purpose: it must NOT follow the deploy URL
 * or the `www` redirect.
 */
const ID_BASE = "https://techconf.es";
const SITE_URL = "https://techconf.es";
const REPO_URL = "https://github.com/npatarino/tech-conferences-spain";

export interface OteSourceConference {
  /** Edition id — the Markdown file name without `.md`. */
  id: string;
  name: string;
  series: string;
  website?: string;
  twitter?: string;
  bluesky?: string;
  location: string;
  city?: string;
  tags: string[];
  languages: string[];
  dateStart: string;
  dateEnd: string;
  dateTbc: boolean;
  cancelled: boolean;
  cfpStart?: string;
  cfpEnd?: string;
  cfpSite?: string;
  lat?: number;
  lng?: number;
}

export type OteEvent = Record<string, unknown>;
export type OteFeed = Record<string, unknown> & { events: OteEvent[] };

const ONLINE_RE = /^(online|twitch)\b/i;
const CANARY_RE = /\b(canarias|tenerife|gran canaria|las palmas|lanzarote|fuerteventura|la gomera|el hierro|la palma)\b/i;

function isOnline(location: string): boolean {
  return ONLINE_RE.test(location.trim());
}

function timezoneFor(location: string): string {
  return CANARY_RE.test(location) ? "Atlantic/Canary" : "Europe/Madrid";
}

/** UTC offset (in minutes) of `timeZone` at the given instant. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(instant)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = part.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * Turn a local date + wall-clock time into an OTE `instant` (RFC 3339 with
 * offset). CFP dates are stored as bare dates, so the caller decides which
 * end of the day they mean.
 */
function toInstant(date: string, time: string, timeZone: string): string {
  const asUtc = new Date(`${date}T${time}Z`);
  const guess = offsetMinutes(asUtc, timeZone);
  // Re-read the offset at the actual instant, so DST-change days resolve right.
  const offset = offsetMinutes(new Date(asUtc.getTime() - guess * 60_000), timeZone);
  const sign = offset < 0 ? "-" : "+";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${date}T${time}${sign}${hh}:${mm}`;
}

function displayName(c: OteSourceConference): string {
  const year = c.dateStart.slice(0, 4);
  // Names in the repo carry neither city nor year; a feed entry is read on
  // its own (a calendar title, an RSS item), so the edition year goes in.
  return /\b(19|20)\d{2}\b/.test(c.name) ? c.name : `${c.name} ${year}`;
}

function cfpFor(c: OteSourceConference, timeZone: string): Record<string, unknown> | undefined {
  if (!c.cfpStart && !c.cfpEnd && !c.cfpSite) return undefined;
  const url = c.cfpSite ?? c.website;
  if (!url || !/^https?:\/\//.test(url)) return undefined;
  const cfp: Record<string, unknown> = { url };
  if (c.cfpStart) cfp.opensAt = toInstant(c.cfpStart, "00:00:00", timeZone);
  if (c.cfpEnd) cfp.closesAt = toInstant(c.cfpEnd, "23:59:59", timeZone);
  return cfp;
}

/**
 * Map one edition to an OTE event (the in-feed form: `specVersion` and
 * `license` are inherited from the feed).
 *
 * What is deliberately NOT emitted, because the repo does not know it:
 * `description`, `image`, `organizers`, `offers`.
 * They are "recommended", not required — the feed is valid without them
 * and the validator reports them as warnings.
 */
export function conferenceToOteEvent(c: OteSourceConference): OteEvent {
  const online = isOnline(c.location);
  const timeZone = timezoneFor(c.location);
  const hasWebsite = !!c.website && /^https?:\/\//.test(c.website);

  const event: OteEvent = {
    id: `${ID_BASE}/conferences/${c.id}`,
    ...(hasWebsite ? { url: c.website } : {}),
    name: displayName(c),
    startDate: c.dateStart,
    endDate: c.dateEnd < c.dateStart ? c.dateStart : c.dateEnd,
    timezone: timeZone,
    attendanceMode: online ? "online" : "in-person",
  };

  if (!online) {
    event.location = {
      venue: c.location,
      address: { ...(c.city ? { locality: c.city } : {}), country: "ES" },
      ...(c.lat != null && c.lng != null ? { geo: { lat: c.lat, lon: c.lng } } : {}),
    };
  }

  // Absent means unknown in OTE; an empty list is not allowed.
  if (c.tags.length) event.tags = c.tags;
  if (c.languages.length) event.languages = c.languages;

  const cfp = cfpFor(c, timeZone);
  if (cfp) event.cfp = cfp;

  event.status = c.cancelled ? "cancelled" : "scheduled";
  event.partOf = {
    id: `${ID_BASE}/series/${c.series}`,
    name: c.name,
    type: "series",
  };
  // TechConf is a curated directory, not the organiser: say where the data
  // comes from so it can be verified (and fixed) upstream.
  if (hasWebsite) event.source = { name: c.name, url: c.website };

  // No core OTE field carries an event's social profiles. Prefixed keys are
  // the spec's "external vocabulary" extension: valid, and they can never
  // collide with a future core field.
  if (c.twitter) event["techconf:twitter"] = c.twitter;
  if (c.bluesky) event["techconf:bluesky"] = c.bluesky;

  return event;
}

/**
 * Build the whole feed.
 *
 * Editions with `date_tbc: true` are left out: their dates are placeholders
 * (often a whole month), and OTE has no way to say "the date is unknown" —
 * `status: tentative` would still publish the placeholder as the real date.
 */
export function buildOteFeed(conferences: OteSourceConference[], updatedAt: Date): OteFeed {
  const events = conferences
    .filter((c) => !c.dateTbc)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart) || a.id.localeCompare(b.id))
    .map(conferenceToOteEvent);

  return {
    specVersion: OTE_SPEC_VERSION,
    title: "TechConf — conferencias técnicas en España",
    description:
      "Listado curado por la comunidad de conferencias de desarrollo de software celebradas en España: pasadas, presentes y futuras.",
    url: SITE_URL,
    // No `organizers` and no `textLanguage`: TechConf aggregates events it
    // does not run, and the spec asks aggregators to leave both out so no
    // event inherits an organiser or a language it never declared.
    license: "CC-BY-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    updatedAt: updatedAt.toISOString(),
    alternates: [{ mediaType: "text/calendar", url: `${SITE_URL}${OTE_ICS_PATH}` }],
    contributing: `${REPO_URL}/issues`,
    events,
  };
}
