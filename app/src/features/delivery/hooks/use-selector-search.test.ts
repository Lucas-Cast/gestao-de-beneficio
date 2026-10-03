import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { api } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { notifications } from "@/services/notifications";
import { useSelectorSearch } from "./use-selector-search";
jest.mock("@/services/api/client", () => ({ api: { get: jest.fn() } }));
const get = jest.mocked(api.get);
beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());
const wrapper = ({ children }: { children: ReactNode }) => (
  createElement(QueryClientProvider, { client: queryClient }, children)
);
test("reopening a selector starts at page one without retaining cached results", async () => {
  get.mockResolvedValue({ data: { data: [{ id: "a" }], total: 40, page: 1 } });
  const { result, unmount } = await renderHook(() =>
    useSelectorSearch("basket", ""),
    { wrapper },
  );
  await waitFor(() => expect(result.current.rows).toHaveLength(1));
  await act(() => result.current.loadMore());
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  await unmount();
  await act(() => jest.runOnlyPendingTimers());
  await renderHook(() => useSelectorSearch("basket", ""), { wrapper });
  await waitFor(() => expect(get).toHaveBeenCalledTimes(3));
  expect(get.mock.calls[2][1]?.params).toEqual({ page: 1, pageSize: 20 });
});
test("closing a selector aborts its request and suppresses late failures", async () => {
  let reject!: (reason: unknown) => void;
  get.mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const { unmount } = await renderHook(() =>
    useSelectorSearch("beneficiary", ""),
    { wrapper },
  );
  const signal = get.mock.calls[0][1]?.signal;
  await unmount();
  expect(signal?.aborted).toBe(true);
  await act(() => reject(new Error("Late failure")));
  expect(notifications.error).not.toHaveBeenCalled();
});
test("failed reads show one safe toast and can be retried", async () => {
  get
    .mockRejectedValueOnce(new Error("private database detail"))
    .mockResolvedValueOnce({
      data: { data: [{ id: "basket" }], total: 1, page: 1 },
    });

  const { result } = await renderHook(() => useSelectorSearch("basket", ""), {
    wrapper,
  });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(notifications.error).toHaveBeenCalledTimes(1);
  expect(notifications.error).toHaveBeenCalledWith(
    "Ocorreu um erro inesperado.",
  );

  await act(() => result.current.retry());
  await waitFor(() => expect(result.current.rows).toEqual([{ id: "basket" }]));
  expect(notifications.error).toHaveBeenCalledTimes(1);
});
test("loads page one, accumulates page two, debounces names and resets pagination", async () => {
  get
    .mockResolvedValueOnce({ data: { data: [{ id: "a" }], total: 2, page: 1 } })
    .mockResolvedValueOnce({ data: { data: [{ id: "b" }], total: 2, page: 2 } })
    .mockResolvedValueOnce({
      data: { data: [{ id: "c" }], total: 1, page: 1 },
    });
  const { result, rerender } = await renderHook(
    ({ text }: { text: string }) => useSelectorSearch("beneficiary", text),
    { initialProps: { text: "" }, wrapper },
  );
  await waitFor(() => expect(result.current.rows).toEqual([{ id: "a" }]));
  expect(get.mock.calls[0][1]?.params).toEqual({ page: 1, pageSize: 20 });
  await act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.rows).toHaveLength(2));
  await rerender({ text: "Ana" });
  expect(result.current.rows).toHaveLength(0);
  expect(get).toHaveBeenCalledTimes(2);
  await act(() => jest.advanceTimersByTime(300));
  await waitFor(() => expect(result.current.rows).toEqual([{ id: "c" }]));
  expect(get.mock.calls[2][1]?.params).toEqual({
    search: "Ana",
    page: 1,
    pageSize: 20,
  });
  expect(result.current.hasMore).toBe(false);
});
test("partial CPF sends no invalid request, formatted CPF becomes exact digits", async () => {
  get.mockResolvedValue({ data: { data: [], total: 0, page: 1 } });
  const { result, rerender } = await renderHook(
    ({ text }: { text: string }) => useSelectorSearch("beneficiary", text),
    { initialProps: { text: "123" }, wrapper },
  );
  expect(result.current.validationError).toBeTruthy();
  expect(get).not.toHaveBeenCalled();
  expect(notifications.error).not.toHaveBeenCalled();
  await rerender({ text: "123.456.789-09" });
  await act(() => jest.advanceTimersByTime(300));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  expect(get.mock.calls[0][1]?.params).toEqual({
    cpf: "12345678909",
    page: 1,
    pageSize: 20,
  });
});
test("late search responses do not replace current results", async () => {
  let resolve!: (value: unknown) => void;
  get.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  get.mockResolvedValueOnce({
    data: { data: [{ id: "new" }], total: 1, page: 1 },
  });
  const { result, rerender } = await renderHook(
    ({ text }: { text: string }) => useSelectorSearch("basket", text),
    { initialProps: { text: "" }, wrapper },
  );
  await rerender({ text: "nova" });
  await act(() => jest.advanceTimersByTime(300));
  await waitFor(() => expect(result.current.rows).toEqual([{ id: "new" }]));
  await act(() =>
    resolve({ data: { data: [{ id: "old" }], total: 1, page: 1 } }),
  );
  expect(result.current.rows).toEqual([{ id: "new" }]);
  expect(notifications.error).not.toHaveBeenCalled();
});
