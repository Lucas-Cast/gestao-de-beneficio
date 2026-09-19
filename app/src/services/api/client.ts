import { create } from 'axios';

import { toApiError } from '@/services/api/errors';
import { session } from '@/services/api/session';

export const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await session.getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = toApiError(error);

    if (apiError.status === 401) {
      try {
        await session.clear();
      } catch {
        // A storage failure must not hide the original API error.
      }
    }

    return Promise.reject(apiError);
  },
);
