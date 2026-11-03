import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

interface Coords { lat: number; lng: number; }
type Cache = Record<string, Coords>;

const CACHE_PATH = resolve(process.cwd(), ".cache/geocode.json");

let cache: Cache | null = null;
// Locations that failed during this build. Kept in memory only, so a
// location shared by several editions is looked up once per build, but a
// transient failure (network, quota, typo fixed later) is retried next build.
const failed = new Set<string>();

async function loadCache(): Promise<Cache> {
  if (cache) return cache;
  try {
    const raw = await readFile(CACHE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, Coords | null>;
    // Older caches stored failures as null; drop them so they get retried.
    cache = Object.fromEntries(
      Object.entries(parsed).filter((e): e is [string, Coords] => e[1] != null),
    );
  } catch {
    cache = {};
  }
  return cache;
}

async function saveCache(): Promise<void> {
  if (!cache) return;
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

/**
 * Geocode a free-form location string via Google Geocoding API.
 * Successful lookups are cached on disk so repeated builds don't re-hit the
 * API; failures are not persisted and are retried on the next build.
 * Returns null when geocoding is unavailable or fails.
 */
export async function geocode(location: string): Promise<Coords | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const c = await loadCache();
  if (location in c) return c[location];
  if (!key || failed.has(location)) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", location);
    url.searchParams.set("key", key);
    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      results?: { geometry: { location: { lat: number; lng: number } } }[];
    };
    if (data.status === "OK" && data.results && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      c[location] = { lat, lng };
      await saveCache();
      return c[location];
    }
  } catch {
    // fall through: treat network/parse errors as a failed lookup
  }

  failed.add(location);
  return null;
}
