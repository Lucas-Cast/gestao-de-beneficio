import { HttpException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DomainError, DomainErrorCode } from './domain-error';

const domainResponses: Record<
  DomainErrorCode,
  { status: number; message: string }
> = {
  INVALID_QUANTITY: { status: 400, message: 'Quantidade inválida.' },
  INSUFFICIENT_STOCK: { status: 409, message: 'Estoque insuficiente.' },
  QUANTITY_OVERFLOW: {
    status: 409,
    message: 'O saldo ultrapassa a quantidade máxima permitida.',
  },
  EMPTY_BASKET: {
    status: 400,
    message: 'A cesta deve conter pelo menos um mantimento.',
  },
  DUPLICATE_BASKET_SUPPLY: {
    status: 400,
    message: 'Cada mantimento deve aparecer uma única vez na cesta.',
  },
  SUPPLY_NOT_FOUND: {
    status: 404,
    message: 'Mantimento não encontrado ou excluído.',
  },
  BASKET_NOT_FOUND: {
    status: 404,
    message: 'Cesta não encontrada ou excluída.',
  },
  BASKET_HAS_DELETED_SUPPLY: {
    status: 409,
    message: 'Restaure os mantimentos excluídos antes de restaurar esta cesta.',
  },
  BENEFICIARY_NOT_FOUND: {
    status: 404,
    message: 'Beneficiário não encontrado ou excluído.',
  },
  INACTIVE_USER: { status: 401, message: 'Usuário não encontrado ou inativo.' },
  INVALID_DATE_RANGE: {
    status: 400,
    message: 'A data inicial deve ser anterior ou igual à data final.',
  },
};

export function toHttpException(error: unknown): unknown {
  if (error instanceof DomainError) {
    const { status, message } = domainResponses[error.code];
    return new HttpException(message, status);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new HttpException('Já existe um registro com esses dados.', 409);
      case 'P2003':
        return new HttpException(
          'Não foi possível concluir a operação devido a um registro relacionado.',
          409,
        );
      case 'P2025':
        return new HttpException('Registro não encontrado.', 404);
      case 'P2034':
        return new HttpException(
          'Houve um conflito com outra operação. Tente novamente.',
          409,
        );
    }
  }
  return error;
}

export async function withHttpErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toHttpException(error);
  }
}
