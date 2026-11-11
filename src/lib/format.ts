const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthLabelEs(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS_ES[Number(m) - 1]} de ${y}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * City to show for an edition: the explicit `city` field, or — for online
 * and region-only editions, which have none — the first part of `location`.
 */
export function cityOf(d: { city?: string; location: string }): string {
  return d.city ?? (d.location.split(",")[0]?.trim() || d.location);
}
