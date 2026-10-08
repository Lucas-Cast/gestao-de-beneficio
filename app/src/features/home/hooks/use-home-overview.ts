import { API_ROUTES } from "@/constants/routes";
import { useApiGet } from "@/hooks/api/use-api-get";

import type {
  HomePage,
  HomeRecentDelivery,
  HomeStats,
} from "../types/home.types";

const RECENT_DELIVERIES_PAGE_SIZE = 3;

export function useHomeOverview() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const stats = useApiGet<HomeStats>(API_ROUTES.basketDeliveries.stats, {
    config: { params: { timeZone } },
  });
  const recentDeliveries = useApiGet<HomePage<HomeRecentDelivery>>(
    API_ROUTES.basketDeliveries.collection,
    { config: { params: { page: 1, pageSize: RECENT_DELIVERIES_PAGE_SIZE } } },
  );

  return {
    indicators: [
      {
        label: "Cestas entregues hoje",
        value: stats.data?.basketsDeliveredToday ?? null,
      },
      {
        label: "Beneficiários atendidos hoje",
        value: stats.data?.beneficiariesAttendedToday ?? null,
      },
      {
        label: "Cestas entregues no mês",
        value: stats.data?.basketsDeliveredThisMonth ?? null,
      },
    ],
    recent: recentDeliveries.data?.data ?? [],
    loading: stats.loading || recentDeliveries.loading,
    recentLoading: recentDeliveries.loading,
  };
}
