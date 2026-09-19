import { useCallback, useRef, useState } from 'react';

import { ApiRequestError, toApiError } from '@/services/api/errors';

type RequestFunction<TResponse> = () => Promise<TResponse>;

export function useApiRequest<TResponse>() {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const latestRequest = useRef(0);

  const execute = useCallback(async (request: RequestFunction<TResponse>) => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const response = await request();

      if (requestId === latestRequest.current) {
        setData(response);
      }

      return response;
    } catch (requestError) {
      const normalizedError = toApiError(requestError);

      if (requestId === latestRequest.current) {
        setError(normalizedError);
      }

      throw normalizedError;
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    latestRequest.current += 1;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
