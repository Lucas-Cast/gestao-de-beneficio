import { isAxiosError } from 'axios';

export type ApiErrorData = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export class ApiRequestError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor({ message, status, code, details }: ApiErrorData) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getResponseMessage(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return data;
  }

  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return undefined;
  }

  const message = data.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
    return message.join(', ');
  }

  return undefined;
}

export function toApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (isAxiosError(error)) {
    return new ApiRequestError({
      message:
        getResponseMessage(error.response?.data) ??
        error.message ??
        'Não foi possível concluir a requisição.',
      status: error.response?.status,
      code: error.code,
      details: error.response?.data,
    });
  }

  if (error instanceof Error) {
    return new ApiRequestError({ message: error.message });
  }

  return new ApiRequestError({
    message: 'Ocorreu um erro inesperado.',
    details: error,
  });
}
