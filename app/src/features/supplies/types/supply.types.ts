export const SUPPLY_UNITS = [
  "UNIT",
  "KILOGRAM",
  "GRAM",
  "LITER",
  "MILLILITER",
  "PACKAGE",
] as const;

export type SupplyUnit = (typeof SUPPLY_UNITS)[number];
export type MovementType = "IN" | "OUT";

export type Supply = {
  id: string;
  name: string;
  description: string | null;
  unit: SupplyUnit;
  currentQuantity: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SupplyPage = {
  data: Supply[];
  total: number;
  page: number;
  pageSize: number;
};

export type SupplyFormValues = {
  name: string;
  description: string;
  unit: string;
  currentQuantity: string;
};

export type StockMovementFormValues = {
  supplyId: string;
  type: string;
  quantity: string;
  reason: string;
};
