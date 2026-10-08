import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import type { Basket, BasketPage } from "../types/basket.types";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
export const BASKETS_QUERY_KEY = ["baskets"] as const;

export function useBasketSearch(text: string, includeDeleted = false) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const search = debouncedText.trim();
  const ready = text === debouncedText;
  const query = useInfiniteQuery<BasketPage, ApiRequestError>({
    queryKey: [
      ...BASKETS_QUERY_KEY,
      includeDeleted ? "deleted" : "active",
      search,
    ],
    enabled: ready,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<BasketPage>(
          includeDeleted
            ? API_ROUTES.baskets.deleted
            : API_ROUTES.baskets.collection,
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
      page.data.filter((basket) => {
        if (seen.has(basket.id)) return false;
        seen.add(basket.id);
        return true;
      }),
    );
  }, [query.data, ready]);

  return {
    rows: rows as Basket[],
    total: query.data?.pages[0]?.total ?? 0,
    loading: query.isFetching || text !== debouncedText,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
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
