import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import type {
  ManagedUserPage,
  ManagedUserStatus,
} from "../types/user.types";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
export const USERS_QUERY_KEY = ["managed-users"] as const;

export function useUserSearch(
  text: string,
  status: ManagedUserStatus,
  enabled = true,
) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const search = debouncedText.trim();
  const waitingForDebounce = text !== debouncedText;
  const params = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    }),
    [search, status],
  );
  const query = useInfiniteQuery<ManagedUserPage, ApiRequestError>({
    queryKey: [...USERS_QUERY_KEY, params],
    enabled: enabled && !waitingForDebounce,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        const response = await api.get<ManagedUserPage>(
          API_ROUTES.users.collection,
          {
            params: { ...params, page: pageParam, pageSize: PAGE_SIZE },
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

  const rows = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages ?? []).flatMap((page) =>
      page.data.filter((user) => {
        if (seen.has(user.id)) return false;
        seen.add(user.id);
        return true;
      }),
    );
  }, [query.data]);

  return {
    rows,
    total: query.data?.pages[0]?.total ?? 0,
    loading: enabled && (query.isFetching || waitingForDebounce),
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    error: query.error,
    hasMore: enabled && Boolean(query.hasNextPage),
    loadMore: () => {
      if (enabled && query.hasNextPage && !query.isFetching)
        void query.fetchNextPage();
    },
    retry: () => {
      if (enabled) void query.refetch();
    },
  };
}
