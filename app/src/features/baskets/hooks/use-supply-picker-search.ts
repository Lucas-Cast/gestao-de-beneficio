import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import type { BasketPage } from "../types/basket.types";

type SupplyOption = BasketPage["data"][number]["supplies"][number]["supply"];
type SupplyPage = { data: SupplyOption[]; total: number; page: number };

const PAGE_SIZE = 20;

export function useSupplyPickerSearch(text: string, enabled: boolean) {
  const [debouncedText, setDebouncedText] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const search = debouncedText.trim();
  const ready = enabled && text === debouncedText;
  const query = useInfiniteQuery<SupplyPage, ApiRequestError>({
    queryKey: ["basket-supply-picker", search],
    enabled: ready,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<SupplyPage>(
          API_ROUTES.supplies.collection,
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
      page.data.filter((supply) => {
        if (seen.has(supply.id)) return false;
        seen.add(supply.id);
        return true;
      }),
    );
  }, [query.data, ready]);

  return {
    rows,
    loading: query.isFetching || (enabled && text !== debouncedText),
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
