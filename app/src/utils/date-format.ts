export function formatDateForDisplay(value: string, invalidFallback = value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);
  if (!Number.isFinite(date.getTime())) return invalidFallback;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function formatDateTimeForDisplay(
  value: string,
  invalidFallback = "Data indisponível",
) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return invalidFallback;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatTimeForDisplay(
  value: string,
  invalidFallback = "Horário indisponível",
) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return invalidFallback;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
