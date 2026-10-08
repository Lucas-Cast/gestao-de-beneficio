export function formatDateForDisplay(value: string, invalidFallback = value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);
  if (!Number.isFinite(date.getTime())) return invalidFallback;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}
