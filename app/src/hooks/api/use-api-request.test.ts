import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, CanceledError } from "axios";
import { createElement, type ReactNode } from "react";
import { notifications } from "@/services/notifications";
import { toApiError } from "@/services/api/errors";
import { queryClient } from "@/services/api/query-client";
import { useApiRequest } from "./use-api-request";
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);
beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});
test("stores and toasts one failed current request, and still rejects", async () => {
  const { result } = await renderHook(() => useApiRequest(), { wrapper });
  await act(async () => {
    await expect(
      result.current.execute(() => Promise.reject(new Error("SQL secret"))),
    ).rejects.toThrow("Ocorreu um erro inesperado.");
  });
  expect(result.current.error?.message).toBe("Ocorreu um erro inesperado.");
  expect(notifications.error).toHaveBeenCalledTimes(1);
  expect(notifications.error).toHaveBeenCalledWith(
    "Ocorreu um erro inesperado.",
  );
});
test("only configured mutation success notifies, ordinary reads do not", async () => {
  const { result } = await renderHook(() => useApiRequest<string>(), {
    wrapper,
  });
  await act(async () => {
    await result.current.execute(() => Promise.resolve("read"));
  });
  expect(notifications.success).not.toHaveBeenCalled();
  const mutation = await renderHook(() =>
    useApiRequest({ successMessage: "Entrega registrada com sucesso." }),
    { wrapper },
  );
  await act(async () => {
    await mutation.result.current.execute(() => Promise.resolve("created"));
  });
  expect(notifications.success).toHaveBeenCalledWith(
    "Entrega registrada com sucesso.",
  );
});

test("run handles mutation callbacks without returning a rejecting promise", async () => {
  const onSuccess = jest.fn();
  const { result } = await renderHook(
    () => useApiRequest({ successMessage: "Concluído." }),
    { wrapper },
  );

  await act(async () => {
    result.current.run(() => Promise.resolve("saved"), { onSuccess });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("saved"));
  });

  expect(notifications.success).toHaveBeenCalledWith("Concluído.");
});

test("run routes failed mutations to the common toast and error callback", async () => {
  const onError = jest.fn();
  const { result } = await renderHook(() => useApiRequest(), { wrapper });

  await act(async () => {
    result.current.run(() => Promise.reject(new Error("database details")), {
      onError,
    });
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
  });

  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Ocorreu um erro inesperado." }),
  );
  expect(notifications.error).toHaveBeenCalledTimes(1);
  expect(notifications.error).toHaveBeenCalledWith(
    "Ocorreu um erro inesperado.",
  );
});
test("canceled and superseded requests never notify or overwrite current data", async () => {
  const { result } = await renderHook(() => useApiRequest<string>(), {
    wrapper,
  });
  let reject!: (reason: unknown) => void;
  const old = new Promise<string>((_, fail) => {
    reject = fail;
  });
  let completion!: Promise<string>;
  await act(async () => {
    completion = result.current.execute(() => old);
    completion.catch(() => undefined);
  });
  await act(async () => {
    await result.current.execute(() => Promise.resolve("latest"));
  });
  await waitFor(() => expect(result.current.data).toBe("latest"));
  await act(async () => {
    reject(new Error("old"));
    await completion.catch(() => undefined);
  });
  expect(result.current.data).toBe("latest");
  expect(notifications.error).not.toHaveBeenCalled();
  await act(async () => {
    await result.current
      .execute(() => Promise.reject(new CanceledError()))
      .catch(() => undefined);
  });
  await waitFor(() =>
    expect(result.current.error?.code).toBe("ERR_CANCELED"),
  );
  expect(notifications.error).not.toHaveBeenCalled();
});
test("network and timeout messages never expose raw transport details", () => {
  expect(
    toApiError(new AxiosError("raw network", "ERR_NETWORK")).message,
  ).toMatch("Não foi possível conectar");
  expect(
    toApiError(new AxiosError("raw timeout", "ECONNABORTED")).message,
  ).toMatch("demorou");
});
test("server failures and HTML responses do not expose infrastructure details", () => {
  expect(
    toApiError({
      isAxiosError: true,
      response: { status: 503, data: { message: "SQL secret" } },
    }).message,
  ).toBe("Não foi possível concluir a requisição.");
  expect(
    toApiError({
      isAxiosError: true,
      response: { status: 400, data: "<html>proxy details</html>" },
    }).message,
  ).toBe("Não foi possível concluir a requisição.");
});
