export type HomeStats = {
  basketsDeliveredToday: number;
  beneficiariesAttendedToday: number;
  basketsDeliveredThisMonth: number;
};

export type HomeRecentDelivery = {
  id: string;
  quantity: number;
  createdAt: string;
  beneficiary: { name: string };
  basket: { name: string };
};

export type HomePage<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
