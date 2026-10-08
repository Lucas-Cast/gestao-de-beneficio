export const SUPPLY_UNIT_FORMATS = {
  UNIT: {
    name: "Unidade",
    label: "unidade",
    abbreviation: "un.",
  },
  KILOGRAM: {
    name: "Quilograma (kg)",
    label: "kg",
    abbreviation: "kg",
  },
  GRAM: { name: "Grama (g)", label: "g", abbreviation: "g" },
  LITER: { name: "Litro (L)", label: "L", abbreviation: "L" },
  MILLILITER: { name: "Mililitro (mL)", label: "mL", abbreviation: "mL" },
  PACKAGE: {
    name: "Pacote",
    label: "pacote",
    abbreviation: "pacote",
    plural: "pacotes",
  },
} as const;

export type SupplyUnit = keyof typeof SUPPLY_UNIT_FORMATS;
export const SUPPLY_UNITS: readonly SupplyUnit[] = Object.freeze(
  Object.keys(SUPPLY_UNIT_FORMATS) as SupplyUnit[],
);
