import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import type { Supply, SupplyPage, SupplyUnit } from "../types/supply.types";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
export const SUPPLIES_QUERY_KEY = ["supplies"] as const;

export function useSupplySearch(text: string, unit: SupplyUnit | "" = "", enabled = true) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const search = debouncedText.trim();
  const ready = enabled && text === debouncedText;
  const query = useInfiniteQuery<SupplyPage, ApiRequestError>({
    queryKey: [...SUPPLIES_QUERY_KEY, "list", { search, unit }],
    enabled: ready,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<SupplyPage>(API_ROUTES.supplies.collection, {
          params: {
            ...(search ? { search } : {}),
            ...(unit ? { unit } : {}),
            page: pageParam,
            pageSize: PAGE_SIZE,
          },
          signal,
        });
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.data.length, 0);
      return lastPage.data.length && loaded < lastPage.total
        ? lastPage.page + 1
        : undefined;
    },
  });

  const rows = useMemo(() => {
    const seen = new Set<string>();
    return (ready ? (query.data?.pages ?? []) : []).flatMap((page) =>
      page.data.filter((supply) => {
        if (seen.has(supply.id)) return false;
        seen.add(supply.id);
        return true;
      }),
    );
  }, [query.data, ready]);

  return {
    rows: rows as Supply[],
    loading: query.isFetching || (enabled && text !== debouncedText),
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
