import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../common/errors/domain-error';
import { MIN_POSITIVE_INTEGER } from '../../../common/domain/integer-limits';
import { withHttpErrors } from '../../../common/errors/to-http-exception';
import { DatabaseService } from '../../database/database.service';
import { StockMovementService } from '../../stock-movement/service/stock-movement.service';
import { BasketDeliveryRepository } from '../basket-delivery.repository';
import { BasketDeliveryDomain } from '../domain/basket-delivery.domain';
import { CreateBasketDeliveryDto } from '../dto/create-basket-delivery.dto';
import { UserService } from '../../user/service/user.service';
import { BeneficiaryService } from '../../beneficiary/service/beneficiary.service';
import { BasketService } from '../../basket/service/basket.service';

@Injectable()
export class BasketDeliveryService {
  constructor(
    private readonly database: DatabaseService,
    private readonly repository: BasketDeliveryRepository,
    private readonly movements: StockMovementService,
    private readonly users: UserService,
    private readonly beneficiaries: BeneficiaryService,
    private readonly baskets: BasketService,
  ) {}

  create(dto: CreateBasketDeliveryDto, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(async (tx) => {
        if (!(await this.users.isActive(tx, actorId)))
          throw new DomainError('INACTIVE_USER');

        const beneficiary = await this.beneficiaries.findByIdInTransaction(
          tx,
          dto.beneficiaryId,
        );
        if (!beneficiary) throw new DomainError('BENEFICIARY_NOT_FOUND');

        const basket = await this.baskets.findByIdInTransaction(
          tx,
          dto.basketId,
        );
        if (!basket) throw new DomainError('BASKET_NOT_FOUND');
        if (basket.supplies.some((item) => item.supply.deletedAt !== null))
          throw new DomainError('SUPPLY_NOT_FOUND');

        const count = dto.quantity ?? MIN_POSITIVE_INTEGER;
        const items = BasketDeliveryDomain.consumption(
          basket.supplies.map((item) => ({
            supplyId: item.supply.id,
            quantity: item.quantity,
          })),
          count,
        );
        const delivery = await this.repository.create(tx, {
          basketId: dto.basketId,
          beneficiaryId: dto.beneficiaryId,
          deliveredById: actorId,
          quantity: count,
          observation: dto.observation,
        });
        const stockMovements: Awaited<
          ReturnType<StockMovementService['record']>
        >[] = [];
        // Consistent row order prevents deadlocks between overlapping basket deliveries.
        for (const item of items) {
          stockMovements.push(
            await this.movements.record(
              tx,
              { ...item, type: 'OUT', reason: 'Entrega de cesta.' },
              actorId,
              delivery.id,
            ),
          );
        }
        return { ...BasketDeliveryDomain.fromPrisma(delivery), stockMovements };
      }),
    );
  }
}
