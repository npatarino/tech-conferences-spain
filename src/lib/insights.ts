/**
 * Insights — every number on /insights is computed here, at build time,
 * from the conference collection. Nothing in the page copy is hardcoded:
 * if the data changes, the story changes with it.
 *
 * Pure functions over plain data, no I/O.
 */
import type { CollectionEntry } from "astro:content";
import { cityOf } from "./format.ts";
import { CITY_COORDS } from "../data/spain.ts";

type Conf = CollectionEntry<"conferences">;

// ───────────────────────────── vocabulary ─────────────────────────────

export type State = "held" | "cancelled" | "upcoming";
export type LangGroup = "es" | "en" | "mixed" | "other" | "unknown";

export interface TopicDef { id: string; label: string; tags: string[] }

/**
 * Topic groups, in priority order: an edition belongs to the first group
 * one of its tags falls in. "general" is the catch-all.
 */
export const TOPICS: TopicDef[] = [
  { id: "ia", label: "IA", tags: ["ai", "ai-agents", "generative-ai"] },
  { id: "seguridad", label: "Seguridad", tags: ["security"] },
  { id: "diversidad", label: "Mujeres en tech", tags: ["women-in-tech", "stem"] },
  { id: "movil", label: "Móvil", tags: ["mobile", "ios", "android", "flutter", "swift", "kotlin", "dart", "apple"] },
  { id: "web", label: "Web y frontend", tags: ["javascript", "frontend", "react", "angular", "css", "webassembly", "wordpress", "drupal", "joomla", "accessibility", "web"] },
  { id: "plataformas", label: "Lenguajes y plataformas", tags: ["java", "jvm", "spring", "groovy", "python", "dotnet", "microsoft", "elixir", "erlang", "functional-programming", "php", "cakephp"] },
  { id: "datos", label: "Datos, cloud y DevOps", tags: ["data", "big-data", "devops", "cloud", "distributed-systems", "api", "power-bi"] },
  { id: "calidad", label: "Testing, agile y crafters", tags: ["testing", "qa", "test-automation", "agile", "scrum", "software-craftsmanship", "open-space", "embedded"] },
  { id: "abierto", label: "Open source", tags: ["open-source", "free-software", "maker", "hardware"] },
  { id: "producto", label: "Producto y negocio", tags: ["product", "startups", "innovation", "engineering-management", "leadership", "careers", "design", "technology", "education", "computer-science", "gamedev"] },
  { id: "general", label: "Generalistas", tags: ["software-development", "google"] },
];
const TOPIC_BY_TAG = new Map<string, string>();
for (const t of TOPICS) for (const tag of t.tags) if (!TOPIC_BY_TAG.has(tag)) TOPIC_BY_TAG.set(tag, t.id);
export const TOPIC_LABEL: Record<string, string> = Object.fromEntries(TOPICS.map((t) => [t.id, t.label]));

/** Brands that travel or have one folder per city: grouped under one family. */
const FAMILY_RULES: [RegExp, string][] = [
  [/^biznagafest/i, "BiznagaFest"],
  [/^devfest/i, "DevFest"],
  [/^(wtm|women techmakers)/i, "Women Techmakers"],
  [/^wordcamp/i, "WordCamp"],
  [/^rooted/i, "RootedCON"],
  [/^netcoreconf/i, "NetCoreConf"],
  [/^agentcamp/i, "AgentCamp"],
  [/^pycon/i, "PyConES"],
  [/^drupal ?camp/i, "DrupalCamp"],
  [/^eslibre/i, "esLibre"],
  [/^(cas\b|conferencia agile spain)/i, "CAS"],
  [/^(aos\b|agile open spain)/i, "Agile Open Spain"],
  [/^codemotion/i, "Codemotion"],
  [/^#?tarugoconf/i, "TarugoConf"],
  [/^(vlc|vcl) ?testing/i, "VLC Testing"],
  [/^wecode/i, "WeCodeFest"],
  [/^s?pamplona (sw|software) crafters/i, "Pamplona Software Crafters"],
  [/^software crafters/i, "Software Crafters Barcelona"],
  [/^(gsas|global software architecture)/i, "GSAS"],
  [/^sou(8)?th summit/i, "South Summit"],
  [/^devops(days)? barcelona/i, "DevOps Barcelona"],
  [/^devopsdays/i, "DevOpsDays"],
  [/^(startup open space|sos\b|sosz)/i, "Startup Open Space"],
  [/^j on the beach/i, "J On The Beach"],
  [/^nerdearla/i, "Nerdearla"],
  [/^opensouthcode/i, "OpenSouthCode"],
  [/^commit/i, "Commit Conf"],
  [/^stem women/i, "STEM Women Congress"],
  [/^pulpocon/i, "PulpoCon"],
  [/^navaja negra/i, "Navaja Negra"],
  [/^bilbao (international )?games/i, "Bilbao Games Conference"],
  [/^bilbao maker faire/i, "Bilbao Maker Faire"],
  [/^react alicante/i, "React Alicante"],
  [/^fredcon/i, "FredCon"],
  [/^try it/i, "Try IT!"],
  [/^drupal day/i, "Drupal Day"],
  [/^cto summit/i, "CTO Summit"],
];

const REGION_BY_CITY: Record<string, string> = {
  "Madrid": "Madrid", "Aranjuez": "Madrid", "Leganés": "Madrid", "Torrelodones": "Madrid", "Boadilla del Monte": "Madrid",
  "Barcelona": "Cataluña", "Sitges": "Cataluña", "Tarragona": "Cataluña", "Girona": "Cataluña", "Lleida": "Cataluña", "L'Hospitalet de Llobregat": "Cataluña",
  "Valencia": "C. Valenciana", "Alicante": "C. Valenciana", "San Vicente del Raspeig": "C. Valenciana", "Benidorm": "C. Valenciana",
  "Sevilla": "Andalucía", "Málaga": "Andalucía", "Granada": "Andalucía", "Córdoba": "Andalucía", "Cádiz": "Andalucía",
  "Conil": "Andalucía", "Jaén": "Andalucía", "Marbella": "Andalucía", "Torremolinos": "Andalucía",
  "Bilbao": "País Vasco", "Vizcaya": "País Vasco",
  "A Coruña": "Galicia", "Santiago de Compostela": "Galicia", "Vigo": "Galicia", "Pontevedra": "Galicia", "Ourense": "Galicia", "Melide": "Galicia", "Galicia": "Galicia",
  "Asturias": "Asturias", "Gijón": "Asturias", "Oviedo": "Asturias", "Avilés": "Asturias",
  "Valladolid": "Castilla y León", "Salamanca": "Castilla y León", "Burgos": "Castilla y León", "Ponferrada": "Castilla y León",
  "Albacete": "Castilla-La Mancha", "Toledo": "Castilla-La Mancha",
  "Zaragoza": "Aragón", "Jaca": "Aragón",
  "Pamplona": "Navarra",
  "Logroño": "La Rioja", "La Rioja": "La Rioja",
  "Cáceres": "Extremadura",
  "Santander": "Cantabria",
  "Menorca": "Baleares",
  "Tenerife": "Canarias", "Las Palmas de Gran Canaria": "Canarias",
};

/** Autonomous communities (and cities) of Spain, to count the ones with no conference. */
const ALL_REGIONS = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-La Mancha", "Castilla y León",
  "Cataluña", "C. Valenciana", "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia", "Navarra", "País Vasco",
];

const ONLINE_RE = /^(online|twitch)\b/i;
export const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ───────────────────────────── editions ─────────────────────────────

export interface Edition {
  id: string;
  /** Brand key: editions of the same event, wherever it is held. */
  family: string;
  /** Edition name without year or annotations. */
  name: string;
  /** Place shown on charts ("Online" for online editions). */
  place: string;
  online: boolean;
  /** The edition names a city (not just a region or island). */
  hasCity: boolean;
  region: string | null;
  year: number;
  /** 1–12 */
  month: number;
  /** 0 = Monday … 6 = Sunday, of the first day. */
  weekday: number;
  days: number;
  start: string;
  end: string;
  state: State;
  /** Dates are placeholders: kept out of every calendar statistic. */
  tbc: boolean;
  tags: string[];
  topic: string;
  lang: LangGroup;
  website: string | null;
  cfpStart: string | null;
  cfpEnd: string | null;
  cfpSite: string | null;
}

function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+-\s+POSTPOSED.*$/i, "")
    .replace(/\s*\b(19|20)\d{2}\b.*$/, "")
    .replace(/\s+/g, " ")
    .trim() || raw;
}

function familyOf(name: string): string {
  for (const [re, fam] of FAMILY_RULES) if (re.test(name)) return fam;
  return name;
}

function langGroup(langs: string[]): LangGroup {
  if (langs.length === 0) return "unknown";
  const hasEs = langs.includes("es");
  const hasEn = langs.includes("en");
  if (hasEs && hasEn) return "mixed";
  if (langs.length === 1 && hasEs) return "es";
  if (langs.length === 1 && hasEn) return "en";
  return "other";
}

function topicOf(tags: string[]): string {
  let best = TOPICS.length;
  for (const tag of tags) {
    const id = TOPIC_BY_TAG.get(tag);
    if (!id) continue;
    const idx = TOPICS.findIndex((t) => t.id === id);
    if (idx < best) best = idx;
  }
  return TOPICS[Math.min(best, TOPICS.length - 1)].id;
}

export function buildEditions(confs: Conf[], todayIso: string): Edition[] {
  const out: Edition[] = [];
  for (const c of confs) {
    const d = c.data;
    const start = new Date(d.dateStart + "T00:00:00Z");
    const online = ONLINE_RE.test(d.location.trim());
    const place = online ? "Online" : cityOf(d);
    const name = cleanName(d.name);
    out.push({
      id: c.id,
      family: familyOf(name),
      name,
      place,
      online,
      hasCity: !online && !!d.city,
      region: online ? null : REGION_BY_CITY[place] ?? null,
      year: start.getUTCFullYear(),
      month: start.getUTCMonth() + 1,
      weekday: (start.getUTCDay() + 6) % 7,
      days: Math.max(1, diffDays(d.dateStart, d.dateEnd) + 1),
      start: d.dateStart,
      end: d.dateEnd,
      state: d.cancelled ? "cancelled" : d.dateStart > todayIso ? "upcoming" : "held",
      tbc: d.dateTbc,
      tags: d.tags,
      topic: topicOf(d.tags),
      lang: langGroup(d.languages),
      website: d.website && /^https?:\/\//.test(d.website) ? d.website : null,
      cfpStart: d.cfpStart ?? null,
      cfpEnd: d.cfpEnd ?? null,
      cfpSite: d.cfpSite ?? null,
    });
  }
  return out.sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}

// ───────────────────────────── helpers ─────────────────────────────

function countBy<T>(items: T[], key: (t: T) => string | number | null | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (k == null || k === "") continue;
    m.set(String(k), (m.get(String(k)) ?? 0) + 1);
  }
  return m;
}

function sorted(m: Map<string, number>): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

export function formatDateEs(iso: string, withYear = true): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTHS_LONG[m - 1]}${withYear ? ` de ${y}` : ""}`;
}

function isoWeek(iso: string): number {
  const d = new Date(iso + "T00:00:00Z");
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

/** Week slot 0–52 inside the edition's own calendar year (for the swarm). */
export function weekSlot(iso: string): number {
  const d = new Date(iso + "T00:00:00Z");
  const jan1 = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.min(52, Math.floor((d.getTime() - jan1) / (7 * 86_400_000)));
}

// ───────────────────────────── the report ─────────────────────────────

export interface FamilyStat {
  family: string;
  editions: number;
  held: number;
  firstYear: number;
  lastYear: number;
  places: string[];
  website: string | null;
  topic: string;
  /** state per year, for the lifeline grid */
  byYear: Record<number, State>;
  hasUpcoming: boolean;
}

export interface PlaceStat {
  place: string;
  region: string | null;
  lat: number;
  lon: number;
  total: number;
  byYear: Record<number, number>;
  firstYear: number;
  families: { family: string; editions: number; website: string | null }[];
  topTopic: string;
}

export function buildReport(all: Edition[], todayIso: string) {
  const currentYear = Number(todayIso.slice(0, 4));
  const real = all.filter((e) => e.state !== "cancelled");
  const held = all.filter((e) => e.state === "held");
  const dated = real.filter((e) => !e.tbc);
  const inPerson = real.filter((e) => !e.online);
  const firstYear = Math.min(...all.map((e) => e.year));
  const years: number[] = [];
  for (let y = firstYear; y <= Math.max(...all.map((e) => e.year)); y++) years.push(y);
  const pastYears = years.filter((y) => y <= currentYear);

  // ── families
  const famMap = new Map<string, Edition[]>();
  for (const e of all) {
    if (!famMap.has(e.family)) famMap.set(e.family, []);
    famMap.get(e.family)!.push(e);
  }
  const families: FamilyStat[] = [...famMap.entries()].map(([family, eds]) => {
    const byYear: Record<number, State> = {};
    const rank: Record<State, number> = { held: 3, upcoming: 2, cancelled: 1 };
    for (const e of eds) if (!byYear[e.year] || rank[e.state] > rank[byYear[e.year]]) byYear[e.year] = e.state;
    const last = eds[eds.length - 1];
    return {
      family,
      editions: eds.filter((e) => e.state !== "cancelled").length,
      held: eds.filter((e) => e.state === "held").length,
      firstYear: eds[0].year,
      lastYear: Math.max(...eds.filter((e) => e.state !== "cancelled").map((e) => e.year), eds[0].year),
      places: [...new Set(eds.filter((e) => !e.online && e.state !== "cancelled").map((e) => e.place))],
      website: [...eds].reverse().find((e) => e.website)?.website ?? null,
      topic: last.topic,
      byYear,
      hasUpcoming: eds.some((e) => e.state === "upcoming"),
    };
  });

  // ── totals
  const placesSet = new Set(inPerson.filter((e) => e.hasCity).map((e) => e.place));
  const totals = {
    editions: all.length,
    held: held.length,
    cancelled: all.length - real.length,
    upcoming: all.filter((e) => e.state === "upcoming").length,
    families: families.length,
    places: placesSet.size,
    regions: new Set(inPerson.map((e) => e.region).filter(Boolean)).size,
    firstYear,
    currentYear,
    daysOfConference: held.filter((e) => !e.tbc && e.days <= 7).reduce((a, e) => a + e.days, 0),
  };

  // ── per year
  const perYear = years.map((year) => {
    const ys = all.filter((e) => e.year === year);
    return {
      year,
      total: ys.length,
      inPerson: ys.filter((e) => e.state === "held" && !e.online).length,
      online: ys.filter((e) => e.state === "held" && e.online).length,
      cancelled: ys.filter((e) => e.state === "cancelled").length,
      upcoming: ys.filter((e) => e.state === "upcoming").length,
      debuts: families.filter((f) => f.firstYear === year).length,
    };
  });
  const worstYear = perYear.filter((p) => p.year <= currentYear).slice().sort((a, b) => b.cancelled - a.cancelled)[0];
  const quietYear = perYear.filter((p) => p.year < currentYear).slice().sort((a, b) => (a.inPerson + a.online) - (b.inPerson + b.online))[0];
  const peakYear = perYear.filter((p) => p.year <= currentYear).slice().sort((a, b) => (b.inPerson + b.online + b.upcoming) - (a.inPerson + a.online + a.upcoming))[0];
  const onlinePeak = perYear.slice().sort((a, b) => b.online - a.online)[0];

  // ── places
  const places: PlaceStat[] = [];
  for (const [place, total] of sorted(countBy(inPerson, (e) => e.place))) {
    const coords = CITY_COORDS[place];
    if (!coords) continue;
    const eds = inPerson.filter((e) => e.place === place);
    const byYear: Record<number, number> = {};
    for (const e of eds) byYear[e.year] = (byYear[e.year] ?? 0) + 1;
    const fams = sorted(countBy(eds, (e) => e.family)).slice(0, 6).map(([family, editions]) => ({
      family,
      editions,
      website: families.find((f) => f.family === family)?.website ?? null,
    }));
    places.push({
      place,
      region: REGION_BY_CITY[place] ?? null,
      lat: coords[0],
      lon: coords[1],
      total,
      byYear,
      firstYear: Math.min(...eds.map((e) => e.year)),
      families: fams,
      topTopic: sorted(countBy(eds.filter((e) => e.topic !== "general"), (e) => e.topic))[0]?.[0] ?? "general",
    });
  }
  const bigTwo = (rows: Edition[]) => pct(rows.filter((e) => e.place === "Madrid" || e.place === "Barcelona").length, rows.length);
  const concentration = pastYears.map((year) => ({ year, share: bigTwo(inPerson.filter((e) => e.year === year)) }));
  const regions = sorted(countBy(inPerson, (e) => e.region)).map(([region, count]) => ({ region, count, share: pct(count, inPerson.length) }));
  const emptyRegions = ALL_REGIONS.filter((r) => !regions.some((x) => x.region === r));
  const newPlaces = places.filter((p) => p.firstYear >= currentYear - 1).map((p) => p.place);

  // ── topics
  const topics = TOPICS.map((t) => {
    const eds = real.filter((e) => e.topic === t.id);
    return {
      id: t.id,
      label: t.label,
      count: eds.length,
      share: pct(eds.length, real.length),
      byYear: pastYears.map((y) => eds.filter((e) => e.year === y).length),
      examples: sorted(countBy(eds, (e) => e.family)).slice(0, 4).map(([f]) => f),
    };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  const tagCounts = sorted(countBy(real.flatMap((e) => e.tags.filter((t) => t !== "software-development")), (t) => t)).slice(0, 24).map(([tag, count]) => ({ tag, count }));
  const ia = topics.find((t) => t.id === "ia");
  const iaFirstBoomYear = ia ? pastYears[ia.byYear.findIndex((n, i) => n >= 3 && i > 0)] ?? null : null;

  // ── languages
  const langKnown = real.filter((e) => e.lang !== "unknown");
  const languages = {
    known: langKnown.length,
    unknown: real.length - langKnown.length,
    groups: (["es", "mixed", "en", "other"] as LangGroup[]).map((g) => ({
      id: g,
      count: langKnown.filter((e) => e.lang === g).length,
      share: pct(langKnown.filter((e) => e.lang === g).length, langKnown.length),
    })),
    byYear: pastYears.map((year) => {
      const ys = langKnown.filter((e) => e.year === year);
      return { year, es: pct(ys.filter((e) => e.lang === "es").length, ys.length), mixed: pct(ys.filter((e) => e.lang === "mixed").length, ys.length), en: pct(ys.filter((e) => e.lang === "en").length, ys.length), other: pct(ys.filter((e) => e.lang === "other").length, ys.length) };
    }),
    englishCities: sorted(countBy(langKnown.filter((e) => e.lang === "en" && !e.online), (e) => e.place)).slice(0, 3).map(([place, count]) => ({ place, count })),
  };

  // ── calendar
  const calendarRows = dated.filter((e) => e.year <= currentYear);
  const byMonth = MONTHS_SHORT.map((_, i) => calendarRows.filter((e) => e.month === i + 1).length);
  const monthRank = byMonth.map((n, i) => ({ month: i, n })).sort((a, b) => b.n - a.n);
  const matrix = pastYears.map((year) => ({ year, months: MONTHS_SHORT.map((_, i) => calendarRows.filter((e) => e.year === year && e.month === i + 1).length) }));
  const byWeekday = WEEKDAYS.map((_, i) => calendarRows.filter((e) => e.weekday === i).length);
  const weekdayRank = byWeekday.map((n, i) => ({ day: i, n })).sort((a, b) => b.n - a.n);
  const shortEvents = calendarRows.filter((e) => e.days <= 7);
  const durations = [1, 2, 3].map((n) => ({ days: n, count: shortEvents.filter((e) => (n === 3 ? e.days >= 3 : e.days === n)).length }));
  const dayLoad = new Map<string, string[]>();
  for (const e of shortEvents) {
    for (let i = 0; i < e.days; i++) {
      const d = new Date(Date.parse(e.start + "T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10);
      if (!dayLoad.has(d)) dayLoad.set(d, []);
      dayLoad.get(d)!.push(e.name);
    }
  }
  const busiest = [...dayLoad.entries()].sort((a, b) => b[1].length - a[1].length || b[0].localeCompare(a[0]))[0];
  const weekLoad = countBy(shortEvents, (e) => `${e.year}-${String(isoWeek(e.start)).padStart(2, "0")}`);
  const busiestWeek = sorted(weekLoad)[0];
  const calendar = {
    byMonth,
    topMonths: monthRank.slice(0, 2).map((m) => ({ month: m.month, n: m.n, share: pct(m.n, calendarRows.length) })),
    summer: byMonth[6] + byMonth[7],
    matrix,
    matrixMax: Math.max(...matrix.flatMap((r) => r.months)),
    byWeekday,
    topWeekdays: weekdayRank.slice(0, 2).map((w) => ({ day: w.day, share: pct(w.n, calendarRows.length) })),
    weekendShare: pct(byWeekday[5] + byWeekday[6], calendarRows.length),
    durations,
    durationTotal: shortEvents.length,
    busiestDay: busiest ? { date: busiest[0], names: [...new Set(busiest[1])] } : null,
    busiestWeek: busiestWeek ? { key: busiestWeek[0], count: busiestWeek[1] } : null,
  };

  // ── longevity
  const multi = families.filter((f) => f.editions >= 2);
  const alive = families.filter((f) => f.lastYear >= currentYear - 1 || f.hasUpcoming);
  const lifelines = families.slice().sort((a, b) => b.editions - a.editions || a.firstYear - b.firstYear || a.family.localeCompare(b.family, "es")).slice(0, 24);
  const sinceStart = families.filter((f) => f.firstYear === firstYear);
  const survivors = sinceStart.filter((f) => f.lastYear >= currentYear - 1 || f.hasUpcoming);
  const memoriam = families
    .filter((f) => f.held >= 2 && f.lastYear <= currentYear - 3 && !f.hasUpcoming)
    .sort((a, b) => b.held - a.held || b.lastYear - a.lastYear)
    .slice(0, 12);
  const oneShots = families.filter((f) => f.editions <= 1 && f.lastYear <= currentYear - 2).length;
  const nomads = families
    .filter((f) => f.places.length >= 4 && !["DevFest", "WordCamp", "AgentCamp", "Women Techmakers"].includes(f.family))
    .sort((a, b) => b.places.length - a.places.length)
    .slice(0, 4)
    .map((f) => ({
      family: f.family,
      stops: famMap.get(f.family)!
        .filter((e) => !e.online && e.state !== "cancelled" && CITY_COORDS[e.place])
        .map((e) => ({ year: e.year, place: e.place, lat: CITY_COORDS[e.place][0], lon: CITY_COORDS[e.place][1] })),
    }));
  const franchises = families
    .filter((f) => ["DevFest", "WordCamp", "Women Techmakers", "AgentCamp"].includes(f.family))
    .map((f) => ({ family: f.family, places: f.places.length, editions: f.editions }))
    .sort((a, b) => b.places - a.places);

  // ── call for papers
  const withCfp = all.filter((e) => e.cfpEnd);
  const leads = withCfp.map((e) => diffDays(e.cfpEnd!, e.start)).filter((n) => n >= 0 && n <= 400);
  const windows = withCfp.filter((e) => e.cfpStart).map((e) => diffDays(e.cfpStart!, e.cfpEnd!)).filter((n) => n > 0 && n <= 400);
  const closeMonths = MONTHS_SHORT.map((_, i) => withCfp.filter((e) => Number(e.cfpEnd!.slice(5, 7)) === i + 1).length);
  const closeRank = closeMonths.map((n, i) => ({ month: i, n })).sort((a, b) => b.n - a.n);
  const openNow = all
    .filter((e) => e.state === "upcoming" && e.cfpEnd && e.cfpEnd >= todayIso && (!e.cfpStart || e.cfpStart <= todayIso))
    .sort((a, b) => a.cfpEnd!.localeCompare(b.cfpEnd!))
    .map((e) => ({ name: e.name, year: e.year, place: e.place, closes: e.cfpEnd!, daysLeft: diffDays(todayIso, e.cfpEnd!), site: e.cfpSite ?? e.website, eventStart: e.start }));
  const cfp = {
    documented: withCfp.length,
    medianLead: median(leads),
    medianWindow: median(windows),
    closeMonths,
    topCloseMonth: closeRank[0],
    openNow,
  };

  // ── records
  const longest = shortEvents.filter((e) => e.days <= 5).sort((a, b) => b.days - a.days || b.start.localeCompare(a.start))[0];
  const FRANCHISES = ["DevFest", "WordCamp", "Women Techmakers", "AgentCamp"];
  const mostEditions = families.filter((f) => !FRANCHISES.includes(f.family)).sort((a, b) => b.editions - a.editions || a.firstYear - b.firstYear)[0];
  const widest = families.slice().sort((a, b) => b.places.length - a.places.length)[0];
  const topPlace = places[0];
  const earliest = calendarRows.slice().sort((a, b) => a.start.slice(5).localeCompare(b.start.slice(5)))[0];
  const latest = calendarRows.slice().sort((a, b) => b.start.slice(5).localeCompare(a.start.slice(5)))[0];
  const north = places.slice().sort((a, b) => b.lat - a.lat)[0];
  const south = places.filter((p) => p.region !== "Canarias").slice().sort((a, b) => a.lat - b.lat)[0];

  return {
    todayIso,
    years,
    pastYears,
    totals,
    perYear,
    worstYear,
    quietYear,
    peakYear,
    onlinePeak,
    places,
    concentration,
    regions,
    emptyRegions,
    newPlaces,
    bigTwoShare: bigTwo(inPerson),
    topics,
    tagCounts,
    iaFirstBoomYear,
    languages,
    calendar,
    families,
    lifelines,
    aliveShare: pct(alive.length, families.length),
    multiCount: multi.length,
    survivors: { of: sinceStart.length, alive: survivors.length },
    memoriam,
    oneShots,
    nomads,
    franchises,
    cfp,
    records: { longest, mostEditions, widest, topPlace, earliest, latest, north, south },
  };
}

export type Report = ReturnType<typeof buildReport>;
