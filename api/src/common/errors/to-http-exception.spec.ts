import { HttpException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DomainError, DomainErrorCode } from './domain-error';
import { toHttpException, withHttpErrors } from './to-http-exception';

describe('HTTP error mapping', () => {
  it.each<[DomainErrorCode, number, string]>([
    ['INSUFFICIENT_STOCK', 409, 'Estoque insuficiente.'],
    ['SUPPLY_NOT_FOUND', 404, 'Mantimento não encontrado ou excluído.'],
    ['EMPTY_BASKET', 400, 'A cesta deve conter pelo menos um mantimento.'],
    ['INACTIVE_USER', 401, 'Usuário não encontrado ou inativo.'],
  ])('maps %s to a safe HTTP response', (code, status, message) => {
    const error = toHttpException(new DomainError(code)) as HttpException;
    expect(error.getStatus()).toBe(status);
    expect(error.getResponse()).toBe(message);
  });

  it.each([
    ['P2002', 409],
    ['P2003', 409],
    ['P2025', 404],
    ['P2034', 409],
  ])('maps Prisma %s without leaking metadata', (code, status) => {
    const error = toHttpException(
      new Prisma.PrismaClientKnownRequestError('private SQL', {
        code: String(code),
        clientVersion: 'test',
        meta: { target: 'privateColumn' },
      }),
    ) as HttpException;
    expect(error.getStatus()).toBe(status);
    expect(JSON.stringify(error.getResponse())).not.toMatch(/private|P20/);
  });

  it('preserves unknown errors for the global filter and maps errors after an operation rejects', async () => {
    const error = new Error('internal');
    expect(toHttpException(error)).toBe(error);
    await expect(withHttpErrors(() => Promise.reject(error))).rejects.toBe(
      error,
    );
    await expect(
      withHttpErrors(() => Promise.reject(new DomainError('INVALID_QUANTITY'))),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
