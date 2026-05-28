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
