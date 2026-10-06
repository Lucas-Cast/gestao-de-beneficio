export type StockMovementType = "IN" | "OUT";

export type StockMovement = {
  id: string;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  basketDeliveryId: string | null;
  createdAt: string;
  supply: {
    id: string;
    name: string;
    unit: "UNIT" | "KILOGRAM" | "GRAM" | "LITER" | "MILLILITER" | "PACKAGE";
  };
  performedBy: { id: string; name: string };
};

export type StockMovementPage = {
  data: StockMovement[];
  total: number;
  page: number;
  pageSize: number;
};

export type StockMovementFilters = {
  supplyId?: string;
  type?: StockMovementType;
  from?: string;
  to?: string;
};
