import { SUPPLY_UNIT_FORMATS, type SupplyUnit } from "@/constants/supply-units";

function getUnitFormat(unit: string) {
  return SUPPLY_UNIT_FORMATS[unit as SupplyUnit];
}

export function supplyUnitName(unit: string) {
  return getUnitFormat(unit)?.name ?? unit;
}

export function supplyUnitLabel(unit: string) {
  return getUnitFormat(unit)?.label ?? unit;
}

export function formatSupplyQuantity(quantity: number, unit: string) {
  const format = getUnitFormat(unit);
  if (!format) return `${quantity} ${unit}`;

  const plural = "plural" in format ? format.plural : undefined;
  const label =
    plural && quantity !== 1 ? plural : format.abbreviation;
  return `${quantity} ${label}`;
}
