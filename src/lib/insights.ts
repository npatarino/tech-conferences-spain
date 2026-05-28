import type { CollectionEntry } from "astro:content";

type Conf = CollectionEntry<"conferences">;

export interface ConfRow {
  id: string;
  series: string;
  name: string;
  city: string;
  year: number;
  month: number;
  weekday: number;
  durationDays: number;
  startIso: string;
  endIso: string;
  cancelled: boolean;
  hasCfp: boolean;
  cfpLeadDays: number | null;
  cfpEndIso: string | null;
}

const SERIES_PATTERN = /-(19|20)\d{2}$/;

function seriesId(id: string): string {
  return id.replace(SERIES_PATTERN, "");
}

function diffDays(a: string, b: string): number {
  const ad = new Date(a + "T00:00:00Z").getTime();
  const bd = new Date(b + "T00:00:00Z").getTime();
  return Math.round((bd - ad) / 86_400_000);
}

export function buildRows(confs: Conf[]): ConfRow[] {
  const rows: ConfRow[] = [];
  for (const c of confs) {
    const d = c.data;
    const start = new Date(d.dateStart + "T00:00:00Z");
    const end = new Date(d.dateEnd + "T00:00:00Z");
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + 1;
    const weekday = start.getUTCDay();
    const durationDays = Math.max(1, diffDays(d.dateStart, d.dateEnd) + 1);
    const cfpLeadDays = d.cfpEnd ? diffDays(d.cfpEnd, d.dateStart) : null;
    rows.push({
      id: c.id,
      series: seriesId(c.id),
      name: d.name.replace(/\s+\d{4}$/, ""),
      city: d.location.split(",")[0]?.trim() || d.location,
      year,
      month,
      weekday,
      durationDays,
      startIso: d.dateStart,
      endIso: d.dateEnd,
      cancelled: d.cancelled,
      hasCfp: !!(d.cfpEnd || d.cfpStart),
      cfpLeadDays,
      cfpEndIso: d.cfpEnd ?? null,
    });
  }
  return rows;
}

export interface YearlyEvolutionPoint { year: number; total: number; cancelled: number; }

export function yearlyEvolution(rows: ConfRow[]): YearlyEvolutionPoint[] {
  const byYear = new Map<number, { total: number; cancelled: number }>();
  for (const r of rows) {
    const e = byYear.get(r.year) ?? { total: 0, cancelled: 0 };
    e.total++;
    if (r.cancelled) e.cancelled++;
    byYear.set(r.year, e);
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, v]) => ({ year, ...v }));
}

export function monthYearMatrix(rows: ConfRow[]): { years: number[]; values: [number, number, number][] } {
  const years = [...new Set(rows.map((r) => r.year))].sort();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.cancelled) continue;
    const k = `${r.year}-${r.month}`;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const values: [number, number, number][] = [];
  for (let yi = 0; yi < years.length; yi++) {
    for (let mi = 0; mi < months.length; mi++) {
      const v = map.get(`${years[yi]}-${months[mi]}`) ?? 0;
      values.push([mi, yi, v]);
    }
  }
  return { years, values };
}

export function weekdayDistribution(rows: ConfRow[]): { all: number[]; recent: number[] } {
  const cur = new Date().getUTCFullYear();
  const recent = rows.filter((r) => r.year >= cur - 2 && !r.cancelled);
  const count = (rs: ConfRow[]) => {
    const c = new Array(7).fill(0);
    for (const r of rs) c[r.weekday]++;
    // Reorder to Mon..Sun
    return [c[1], c[2], c[3], c[4], c[5], c[6], c[0]];
  };
  return { all: count(rows.filter((r) => !r.cancelled)), recent: count(recent) };
}

export interface SeriesLongevity { series: string; name: string; editions: number; firstYear: number; lastYear: number; alive: boolean; }

export function seriesLongevity(rows: ConfRow[], currentYear: number): SeriesLongevity[] {
  const groups = new Map<string, ConfRow[]>();
  for (const r of rows) {
    if (!groups.has(r.series)) groups.set(r.series, []);
    groups.get(r.series)!.push(r);
  }
  const out: SeriesLongevity[] = [];
  for (const [series, rs] of groups) {
    const sorted = rs.slice().sort((a, b) => a.year - b.year);
    const firstYear = sorted[0].year;
    const lastYear = sorted[sorted.length - 1].year;
    out.push({
      series,
      name: sorted[sorted.length - 1].name,
      editions: rs.length,
      firstYear,
      lastYear,
      alive: lastYear >= currentYear,
    });
  }
  return out;
}

export function debutsByYear(rows: ConfRow[]): { year: number; debuts: number; returning: number }[] {
  const longevity = seriesLongevity(rows, new Date().getUTCFullYear());
  const debutYearOf = new Map<string, number>();
  for (const l of longevity) debutYearOf.set(l.series, l.firstYear);
  const byYear = new Map<number, { debuts: number; returning: number }>();
  for (const r of rows) {
    const e = byYear.get(r.year) ?? { debuts: 0, returning: 0 };
    if (debutYearOf.get(r.series) === r.year) e.debuts++;
    else e.returning++;
    byYear.set(r.year, e);
  }
  return [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, ...v }));
}

export function geographicTrend(rows: ConfRow[]): {
  topAllTime: { city: string; count: number }[];
  recentShare: { city: string; pct: number }[];
  earlyShare: { city: string; pct: number }[];
  emerging: { city: string; firstYear: number }[];
  recentYears: [number, number];
  earlyYears: [number, number];
} {
  const cur = new Date().getUTCFullYear();
  const recentYears: [number, number] = [cur - 2, cur];
  const earlyYears: [number, number] = [cur - 5, cur - 3];

  const all = new Map<string, number>();
  const recent = new Map<string, number>();
  const early = new Map<string, number>();
  const firstSeen = new Map<string, number>();

  for (const r of rows) {
    if (r.cancelled) continue;
    if (!r.city) continue;
    all.set(r.city, (all.get(r.city) ?? 0) + 1);
    if (r.year >= recentYears[0] && r.year <= recentYears[1]) recent.set(r.city, (recent.get(r.city) ?? 0) + 1);
    if (r.year >= earlyYears[0] && r.year <= earlyYears[1]) early.set(r.city, (early.get(r.city) ?? 0) + 1);
    const fs = firstSeen.get(r.city);
    if (fs == null || r.year < fs) firstSeen.set(r.city, r.year);
  }

  const totalRecent = [...recent.values()].reduce((a, b) => a + b, 0) || 1;
  const totalEarly = [...early.values()].reduce((a, b) => a + b, 0) || 1;

  const topAllTime = [...all.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, count }));
  const recentShare = [...recent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, pct: (count / totalRecent) * 100 }));
  const earlyShare = [...early.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, pct: (count / totalEarly) * 100 }));
  const emerging = [...firstSeen.entries()]
    .filter(([_, y]) => y >= cur - 2)
    .sort((a, b) => b[1] - a[1])
    .map(([city, firstYear]) => ({ city, firstYear }));

  return { topAllTime, recentShare, earlyShare, emerging, recentYears, earlyYears };
}

export function durationByYear(rows: ConfRow[]): { years: number[]; oneDay: number[]; twoDay: number[]; threePlus: number[] } {
  const years = [...new Set(rows.map((r) => r.year))].sort();
  const buckets = new Map<number, { one: number; two: number; three: number }>();
  for (const r of rows) {
    if (r.cancelled) continue;
    const e = buckets.get(r.year) ?? { one: 0, two: 0, three: 0 };
    if (r.durationDays === 1) e.one++;
    else if (r.durationDays === 2) e.two++;
    else e.three++;
    buckets.set(r.year, e);
  }
  return {
    years,
    oneDay: years.map((y) => buckets.get(y)?.one ?? 0),
    twoDay: years.map((y) => buckets.get(y)?.two ?? 0),
    threePlus: years.map((y) => buckets.get(y)?.three ?? 0),
  };
}

const REGION_BY_CITY: Record<string, string> = {
  // Madrid
  "Madrid": "Madrid", "Aranjuez": "Madrid", "Leganes": "Madrid", "Leganés": "Madrid",
  "Campus de Google": "Madrid",
  // Cataluña
  "Barcelona": "Cataluña", "Sitges": "Cataluña", "Tarragona": "Cataluña", "Girona": "Cataluña",
  "Auditori AXA": "Cataluña", "BAU Barcelona": "Cataluña",
  // Comunidad Valenciana
  "Valencia": "Comunidad Valenciana", "Alicante": "Comunidad Valenciana",
  "San Vicente del Raspeig": "Comunidad Valenciana", "Benidorm": "Comunidad Valenciana",
  // Andalucía
  "Sevilla": "Andalucía", "Málaga": "Andalucía", "Malaga": "Andalucía", "Granada": "Andalucía",
  "Córdoba": "Andalucía", "Cádiz": "Andalucía", "Cadiz": "Andalucía", "Conil": "Andalucía",
  "Jaen": "Andalucía", "Jaén": "Andalucía", "Marbella": "Andalucía", "Torremolinos": "Andalucía",
  // País Vasco
  "Bilbao": "País Vasco", "Vizcaya": "País Vasco", "Euskalduna Centre": "País Vasco",
  "Palacio Euskalduna": "País Vasco", "Fábrica Artiach": "País Vasco",
  // Galicia
  "A Coruña": "Galicia", "Santiago de Compostela": "Galicia", "Vigo": "Galicia",
  "Pontevedra": "Galicia", "Ourense": "Galicia", "Melide": "Galicia",
  // Asturias
  "Asturias": "Asturias", "Gijón": "Asturias", "Oviedo": "Asturias", "Avilés": "Asturias",
  // Castilla y León
  "Valladolid": "Castilla y León", "Salamanca": "Castilla y León", "Burgos": "Castilla y León",
  // Castilla-La Mancha
  "Albacete": "Castilla-La Mancha",
  // Aragón
  "Zaragoza": "Aragón", "Jaca": "Aragón",
  // Navarra
  "Pamplona": "Navarra",
  // La Rioja
  "Logroño": "La Rioja", "La Rioja": "La Rioja",
  // Extremadura
  "Cáceres": "Extremadura",
  // Murcia, Cataluña, etc.
  "Lleida": "Cataluña",
  // Canarias
  "Tenerife": "Canarias",
  // Online
  "Online": "Online", "Online.": "Online", "Twitch": "Online",
};

function regionFor(city: string): string {
  return REGION_BY_CITY[city] ?? "Otra";
}

export interface BusyWeek { isoWeek: string; year: number; week: number; count: number; events: string[]; }

function isoWeekOf(d: Date): { year: number; week: number } {
  // ISO week algorithm
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86_400_000;
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { year: target.getUTCFullYear(), week };
}

export function busiestWeeks(rows: ConfRow[]): { busiest: BusyWeek[]; emptyWeeks: BusyWeek[] } {
  const byKey = new Map<string, { year: number; week: number; events: Set<string>; }>();
  const cur = new Date().getUTCFullYear();
  const window = rows.filter((r) => !r.cancelled && r.year >= cur - 2 && r.year <= cur + 1);
  for (const r of window) {
    const start = new Date(r.startIso + "T00:00:00Z");
    const end = new Date(r.endIso + "T00:00:00Z");
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const { year, week } = isoWeekOf(d);
      const key = `${year}-${String(week).padStart(2, "0")}`;
      const e = byKey.get(key) ?? { year, week, events: new Set<string>() };
      e.events.add(r.series);
      byKey.set(key, e);
    }
  }
  const all: BusyWeek[] = [...byKey.entries()].map(([isoWeek, v]) => ({
    isoWeek, year: v.year, week: v.week, count: v.events.size, events: [...v.events],
  }));
  const busiest = all.slice().sort((a, b) => b.count - a.count || a.isoWeek.localeCompare(b.isoWeek)).slice(0, 8);

  // Empty weeks: weeks 1..52 in the next 12 months that have 0 events.
  const todayIsoStr = new Date().toISOString().slice(0, 10);
  const futureWeeks = new Set<string>();
  const probe = new Date();
  for (let i = 0; i < 52; i++) {
    probe.setUTCDate(probe.getUTCDate() + 7);
    const { year, week } = isoWeekOf(probe);
    futureWeeks.add(`${year}-${String(week).padStart(2, "0")}`);
  }
  const occupied = new Set([...byKey.keys()]);
  const empty: BusyWeek[] = [...futureWeeks]
    .filter((k) => !occupied.has(k))
    .slice(0, 8)
    .map((isoWeek) => {
      const [y, w] = isoWeek.split("-");
      return { isoWeek, year: Number(y), week: Number(w), count: 0, events: [] };
    });

  void todayIsoStr;
  return { busiest, emptyWeeks: empty };
}

export interface CadencePoint { series: string; name: string; medianGapMonths: number; editions: number; }

export function cadence(rows: ConfRow[]): CadencePoint[] {
  const groups = new Map<string, ConfRow[]>();
  for (const r of rows) {
    if (!groups.has(r.series)) groups.set(r.series, []);
    groups.get(r.series)!.push(r);
  }
  const out: CadencePoint[] = [];
  for (const [series, rs] of groups) {
    if (rs.length < 2) continue;
    const sorted = rs.slice().sort((a, b) => a.startIso.localeCompare(b.startIso));
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const months = diffDays(sorted[i - 1].startIso, sorted[i].startIso) / 30.44;
      gaps.push(months);
    }
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    out.push({ series, name: sorted[sorted.length - 1].name, medianGapMonths: Math.round(median * 10) / 10, editions: sorted.length });
  }
  return out;
}

export interface DormantSeries { series: string; name: string; lastYear: number; editions: number; yearsSilent: number; }

export function dormantSeries(rows: ConfRow[], currentYear: number): DormantSeries[] {
  const longevity = seriesLongevity(rows, currentYear);
  return longevity
    .filter((l) => currentYear - l.lastYear >= 3 && l.editions >= 2)
    .map((l) => ({ series: l.series, name: l.name, lastYear: l.lastYear, editions: l.editions, yearsSilent: currentYear - l.lastYear }))
    .sort((a, b) => b.editions - a.editions || a.yearsSilent - b.yearsSilent)
    .slice(0, 12);
}

export function regionBreakdown(rows: ConfRow[]): {
  recent: { region: string; count: number; pct: number }[];
  early: { region: string; count: number; pct: number }[];
  recentYears: [number, number];
  earlyYears: [number, number];
} {
  const cur = new Date().getUTCFullYear();
  const recentYears: [number, number] = [cur - 2, cur];
  const earlyYears: [number, number] = [cur - 5, cur - 3];

  const tally = (range: [number, number]) => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.cancelled) continue;
      if (r.year < range[0] || r.year > range[1]) continue;
      const region = regionFor(r.city);
      map.set(region, (map.get(region) ?? 0) + 1);
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([region, count]) => ({ region, count, pct: (count / total) * 100 }));
  };

  return {
    recent: tally(recentYears),
    early: tally(earlyYears),
    recentYears,
    earlyYears,
  };
}

export function weekOfYearHeat(rows: ConfRow[]): { years: number[]; values: [number, number, number][] } {
  const cur = new Date().getUTCFullYear();
  const inWindow = rows.filter((r) => !r.cancelled && r.year >= cur - 4 && r.year <= cur);
  const years = [...new Set(inWindow.map((r) => r.year))].sort();
  const map = new Map<string, number>();
  for (const r of inWindow) {
    const start = new Date(r.startIso + "T00:00:00Z");
    const { year, week } = isoWeekOf(start);
    if (!years.includes(year)) continue;
    const k = `${year}-${week}`;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const values: [number, number, number][] = [];
  for (let yi = 0; yi < years.length; yi++) {
    for (let w = 1; w <= 53; w++) {
      const v = map.get(`${years[yi]}-${w}`) ?? 0;
      values.push([w - 1, yi, v]);
    }
  }
  return { years, values };
}

export function cfpStats(rows: ConfRow[]): {
  withCfp: number;
  withoutCfp: number;
  avgLeadDays: number | null;
  medianLeadDays: number | null;
  closingMonths: number[];
} {
  const withCfp = rows.filter((r) => r.hasCfp).length;
  const withoutCfp = rows.length - withCfp;
  const leads = rows
    .map((r) => r.cfpLeadDays)
    .filter((v): v is number => v != null && v >= 0 && v <= 365);
  const sum = leads.reduce((a, b) => a + b, 0);
  const sorted = leads.slice().sort((a, b) => a - b);
  const median = sorted.length === 0 ? null : sorted[Math.floor(sorted.length / 2)];
  const closingMonths = new Array(12).fill(0);
  for (const r of rows) {
    if (!r.cfpEndIso) continue;
    const m = Number(r.cfpEndIso.slice(5, 7));
    if (m >= 1 && m <= 12) closingMonths[m - 1]++;
  }
  return {
    withCfp,
    withoutCfp,
    avgLeadDays: leads.length ? Math.round(sum / leads.length) : null,
    medianLeadDays: median,
    closingMonths,
  };
}
