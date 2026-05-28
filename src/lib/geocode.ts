import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

interface Coords { lat: number; lng: number; }
type Cache = Record<string, Coords | null>;

const CACHE_PATH = resolve(process.cwd(), ".cache/geocode.json");

let cache: Cache | null = null;

async function loadCache(): Promise<Cache> {
  if (cache) return cache;
  try {
    const raw = await readFile(CACHE_PATH, "utf-8");
    cache = JSON.parse(raw) as Cache;
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
 * Cached on disk so repeated builds don't re-hit the API.
 * Returns null when geocoding is unavailable or fails.
 */
export async function geocode(location: string): Promise<Coords | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const c = await loadCache();
  if (location in c) return c[location];

  if (!key) {
    c[location] = null;
    return null;
  }

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
    } else {
      c[location] = null;
    }
  } catch {
    c[location] = null;
  }

  await saveCache();
  return c[location];
}
