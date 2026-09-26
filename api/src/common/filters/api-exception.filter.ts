import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';

const defaults: Record<number, string> = {
  400: 'Requisição inválida.',
  401: 'Autenticação necessária.',
  403: 'Acesso não permitido.',
  404: 'Recurso não encontrado.',
  405: 'Método não permitido.',
  409: 'Conflito ao processar a operação.',
  413: 'O conteúdo enviado excede o tamanho permitido.',
  422: 'Dados inválidos.',
  429: 'Muitas requisições. Tente novamente mais tarde.',
  500: 'Ocorreu um erro interno.',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    let message: string | string[] =
      defaults[status] ?? 'Não foi possível concluir a operação.';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const candidate: unknown =
        typeof body === 'string'
          ? body
          : (body as { message?: unknown }).message;
      if (
        typeof candidate === 'string' &&
        candidate !== STATUS_CODES[status] &&
        !candidate.startsWith('Cannot ') &&
        !candidate.startsWith('Validation failed') &&
        !candidate.startsWith('Unexpected token')
      )
        message = candidate;
      if (
        Array.isArray(candidate) &&
        candidate.every((item) => typeof item === 'string')
      )
        message = candidate;
    }
    if (status >= 500)
      this.logger.error(
        `${request.method} ${request.path}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    response.status(status).json({ statusCode: status, message });
  }
}
