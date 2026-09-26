import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class BasketDeliveryRepository {
  // TODO: Move this query to the BeneficiaryRepository when the beneficiary module is created.
  findBeneficiary(tx: Prisma.TransactionClient, id: string) {
    return tx.beneficiary.findFirst({ where: { id, deletedAt: null } });
  }

  // TODO: Move this query to the BasketRepository when the basket module is created.
  findBasket(tx: Prisma.TransactionClient, id: string) {
    return tx.basket.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplies: { where: { deletedAt: null }, include: { supply: true } },
      },
    });
  }

  create(
    tx: Prisma.TransactionClient,
    data: Prisma.BasketDeliveryUncheckedCreateInput,
  ) {
    return tx.basketDelivery.create({ data });
  }
}
