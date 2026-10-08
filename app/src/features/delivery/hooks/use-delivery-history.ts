import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import type { DeliveryHistoryEntry, Page } from "../types/delivery.types";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
export const DELIVERY_HISTORY_QUERY_KEY = ["delivery-history"] as const;

export function useDeliveryHistory(text: string) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const search = debouncedText.trim();
  const ready = text === debouncedText;
  const query = useInfiniteQuery<Page<DeliveryHistoryEntry>, ApiRequestError>({
    queryKey: [...DELIVERY_HISTORY_QUERY_KEY, search],
    enabled: ready,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<Page<DeliveryHistoryEntry>>(
          API_ROUTES.basketDeliveries.collection,
          {
            params: {
              ...(search ? { search } : {}),
              page: pageParam,
              pageSize: PAGE_SIZE,
            },
            signal,
          },
        );
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((total, page) => total + page.data.length, 0);
      return lastPage.data.length > 0 && loaded < lastPage.total
        ? lastPage.page + 1
        : undefined;
    },
  });

  const rows = useMemo(() => {
    const seen = new Set<string>();
    return (ready ? (query.data?.pages ?? []) : []).flatMap((page) =>
      page.data.filter((delivery) => {
        if (seen.has(delivery.id)) return false;
        seen.add(delivery.id);
        return true;
      }),
    );
  }, [query.data, ready]);

  return {
    rows,
    loading: query.isFetching || !ready,
    loadingMore: query.isFetchingNextPage,
    error: ready ? query.error : null,
    hasMore: ready && Boolean(query.hasNextPage),
    loadMore: () => {
      if (ready && query.hasNextPage && !query.isFetching)
        void query.fetchNextPage();
    },
    retry: () => {
      if (ready) void query.refetch();
    },
  };
}
