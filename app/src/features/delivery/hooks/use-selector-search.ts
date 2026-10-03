import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import { beneficiarySearch } from "../validation/delivery.schema";
import type { Page } from "../types/delivery.types";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
type SelectorKind = "beneficiary" | "basket";

export function useSelectorSearch<T extends { id: string }>(
  kind: SelectorKind,
  text: string,
) {
  const debouncedText = useDebouncedText(text);
  const search = buildSearch(kind, debouncedText);
  const validationError = buildSearch(kind, text).error;
  const waitingForDebounce = text !== debouncedText;
  const canSearch = !waitingForDebounce && !search.error;
  const url =
    kind === "beneficiary"
      ? API_ROUTES.beneficiaries.collection
      : API_ROUTES.baskets.collection;

  const query = useInfiniteQuery<Page<T>, ApiRequestError>({
    queryKey: ["selector-search", kind, search.params],
    enabled: canSearch,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<Page<T>>(url, {
          params: { ...search.params, page: pageParam, pageSize: PAGE_SIZE },
          signal,
        });
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    getNextPageParam,
  });

  const rows = useMemo(
    () => (canSearch ? uniqueRows(query.data?.pages ?? []) : []),
    [canSearch, query.data],
  );
  const canLoadMore = canSearch && query.hasNextPage && !query.isFetching;

  return {
    rows,
    loading: query.isFetching || (waitingForDebounce && !validationError),
    error: canSearch ? query.error : null,
    validationError,
    hasMore: canSearch && query.hasNextPage,
    loadMore: () => {
      if (canLoadMore) void query.fetchNextPage();
    },
    retry: () => {
      if (canSearch) void query.refetch();
    },
  };
}

function useDebouncedText(text: string) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  return debouncedText;
}

function buildSearch(
  kind: SelectorKind,
  text: string,
): ReturnType<typeof beneficiarySearch> {
  if (kind === "beneficiary") return beneficiarySearch(text);

  const name = text.trim();
  return { params: name ? { search: name } : {} };
}

function getNextPageParam<T>(lastPage: Page<T>, pages: Page<T>[]) {
  if (lastPage.data.length === 0) return undefined;

  const loaded = pages.reduce((total, page) => total + page.data.length, 0);
  return loaded < lastPage.total ? lastPage.page + 1 : undefined;
}

function uniqueRows<T extends { id: string }>(pages: Page<T>[]) {
  const rows: T[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    for (const row of page.data) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  }

  return rows;
}
