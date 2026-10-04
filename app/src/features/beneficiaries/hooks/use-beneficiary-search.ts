import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import type { Beneficiary, BeneficiaryPage } from "../types/beneficiary.types";
import { onlyDigits } from "../utils/beneficiary-format";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
export const BENEFICIARIES_QUERY_KEY = ["beneficiaries"] as const;

function buildFilter(text: string) {
  const value = text.trim();
  if (!value) return { params: {}, error: undefined };

  if (/^[\d.\s-]+$/.test(value)) {
    const cpf = onlyDigits(value);
    return cpf.length === 11
      ? { params: { cpf }, error: undefined }
      : { params: {}, error: "Complete os 11 dígitos do CPF." };
  }

  return { params: { search: value }, error: undefined };
}

export function useBeneficiarySearch(text: string, includeDeleted = false) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const filter = useMemo(() => buildFilter(debouncedText), [debouncedText]);
  const validation = buildFilter(text);
  const waitingForDebounce = text !== debouncedText;
  const ready = !waitingForDebounce && !filter.error;

  const query = useInfiniteQuery<BeneficiaryPage, ApiRequestError>({
    queryKey: [
      ...BENEFICIARIES_QUERY_KEY,
      includeDeleted ? "deleted" : "active",
      filter.params,
    ],
    enabled: ready,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<BeneficiaryPage>(
          includeDeleted
            ? API_ROUTES.beneficiaries.deleted
            : API_ROUTES.beneficiaries.collection,
          {
            params: { ...filter.params, page: pageParam, pageSize: PAGE_SIZE },
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
      return lastPage.data.length > 0 && loaded < lastPage.total
        ? lastPage.page + 1
        : undefined;
    },
  });

  const rows = useMemo(() => {
    const seen = new Set<string>();
    return (ready ? (query.data?.pages ?? []) : []).flatMap((page) =>
      page.data.filter((beneficiary) => {
        if (seen.has(beneficiary.id)) return false;
        seen.add(beneficiary.id);
        return true;
      }),
    );
  }, [query.data, ready]);

  return {
    rows: rows as Beneficiary[],
    total: query.data?.pages[0]?.total ?? 0,
    loading: query.isFetching || (waitingForDebounce && !validation.error),
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    error: ready ? query.error : null,
    validationError: validation.error,
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
