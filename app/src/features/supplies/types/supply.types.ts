import { SUPPLY_UNITS, type SupplyUnit } from "@/constants/supply-units";

export { SUPPLY_UNITS };
export type { SupplyUnit };
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
