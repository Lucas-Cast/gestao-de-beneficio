import type { SelectOption } from "@/components/ui/select-field";
import type { SupplyUnit } from "../types/supply.types";

export const SUPPLY_UNIT_OPTIONS: readonly SelectOption[] = [
  { value: "UNIT", label: "Unidade" },
  { value: "KILOGRAM", label: "Quilograma (kg)" },
  { value: "GRAM", label: "Grama (g)" },
  { value: "LITER", label: "Litro (L)" },
  { value: "MILLILITER", label: "Mililitro (mL)" },
  { value: "PACKAGE", label: "Pacote" },
];

const SHORT_UNIT_LABELS: Record<SupplyUnit, string> = {
  UNIT: "un.",
  KILOGRAM: "kg",
  GRAM: "g",
  LITER: "L",
  MILLILITER: "mL",
  PACKAGE: "pacote",
};

export function unitLabel(unit: SupplyUnit) {
  return SUPPLY_UNIT_OPTIONS.find((option) => option.value === unit)?.label ?? unit;
}

export function formatSupplyQuantity(quantity: number, unit: SupplyUnit) {
  if (unit === "PACKAGE")
    return `${quantity} ${quantity === 1 ? "pacote" : "pacotes"}`;
  return `${quantity} ${SHORT_UNIT_LABELS[unit]}`;
}
