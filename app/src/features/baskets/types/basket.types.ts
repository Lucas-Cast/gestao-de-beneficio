export type BasketSupply = {
  id: string;
  quantity: number;
  deletedAt: string | null;
  supply: {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    currentQuantity: number;
    deletedAt: string | null;
  };
};

export type Basket = {
  id: string;
  name: string;
  description: string | null;
  supplies: BasketSupply[];
  availableBasketCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BasketPage = {
  data: Basket[];
  total: number;
  page: number;
  pageSize: number;
};

export type SupplyOption = BasketSupply["supply"];

export type BasketFormValues = {
  name: string;
  description: string;
  supplies: { supplyId: string; quantity: string }[];
};
