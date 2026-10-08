export type Page<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
export type Beneficiary = {
  id: string;
  name: string;
  cpf: string;
  address: { city: string; neighborhood: string };
};
export type Supply = {
  id: string;
  name: string;
  unit: string;
  currentQuantity: number;
};
export type Basket = {
  id: string;
  name: string;
  description: string | null;
  supplies: { id: string; quantity: number; supply: Supply }[];
};
export type DeliveryPayload = {
  beneficiaryId: string;
  basketId: string;
  quantity: number;
  observation?: string;
};
export type Delivery = {
  id: string;
  quantity: number;
  observation: string | null;
  createdAt: string;
};
export type DeliveryHistoryEntry = {
  id: string;
  quantity: number;
  observation: string | null;
  createdAt: string;
  beneficiary: {
    id: string;
    name: string;
    cpf: string;
  };
  basket: {
    id: string;
    name: string;
    description: string | null;
    deletedAt: string | null;
  };
  deliveredBy: {
    id: string;
    name: string;
    email: string;
  };
  stockMovements: {
    id: string;
    type: "IN" | "OUT";
    quantity: number;
    reason: string | null;
    supply: {
      id: string;
      name: string;
      unit: string;
    };
    performedBy: {
      id: string;
      name: string;
    };
  }[];
};
