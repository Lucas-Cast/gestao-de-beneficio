export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhoneInput(value: string) {
  let digits = onlyDigits(value).slice(0, 13);
  let countryCode = "";
  if (digits.startsWith("55") && digits.length > 11) {
    countryCode = "+55 ";
    digits = digits.slice(2);
  }
  if (digits.length === 0) return countryCode;
  if (digits.length <= 2) return `${countryCode}(${digits}`;
  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  if (subscriber.length <= 4)
    return `${countryCode}(${areaCode}) ${subscriber}`;
  const splitAt = subscriber.length - 4;
  return `${countryCode}(${areaCode}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value);
  return formatPhoneInput(digits);
}

export function formatPostalCodeInput(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatCpfForDisplay(value: string) {
  return formatCpf(value);
}
