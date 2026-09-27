export const BENEFICIARY_SEXES = ['M', 'F'] as const;
export type BeneficiarySex = (typeof BENEFICIARY_SEXES)[number];
export const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export function isValidCpf(value: unknown): boolean {
  if (
    typeof value !== 'string' ||
    !/^\d{11}$/.test(value) ||
    /^(\d)\1{10}$/.test(value)
  )
    return false;
  const digits = Array.from(value, Number);
  for (const length of [9, 10]) {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    if (digits[length] !== (remainder === 10 ? 0 : remainder)) return false;
  }
  return true;
}

export function isValidBirthDate(value: unknown, today: Date): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value <= today.toISOString().slice(0, 10)
  );
}
