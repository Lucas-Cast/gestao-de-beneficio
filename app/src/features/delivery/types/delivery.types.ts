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
