import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";
import type { AuditLogFilters, AuditLogPage } from "../types/audit";

const PAGE_SIZE = 20;

export function useAuditLogs(filters: AuditLogFilters) {
  const query = useInfiniteQuery<AuditLogPage, ApiRequestError>({
    queryKey: ["audit-logs", filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<AuditLogPage>(
          API_ROUTES.auditLogs.collection,
          {
            params: { ...filters, page: pageParam, pageSize: PAGE_SIZE },
            signal,
          },
        );
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.data.length, 0);
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const rows = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  return {
    rows,
    loading: query.isPending,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    error: query.error,
    hasMore: Boolean(query.hasNextPage),
    refresh: () => void query.refetch(),
    loadMore: () => {
      if (query.hasNextPage && !query.isFetching) void query.fetchNextPage();
    },
  };
}
