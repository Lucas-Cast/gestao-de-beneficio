import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { withHttpErrors } from '../../../common/errors/to-http-exception';
import { SupplyDomain } from '../domain/supply.domain';
import { CreateSupplyDto } from '../dto/create-supply.dto';
import { UpdateSupplyDto } from '../dto/update-supply.dto';
import { ListSuppliesDto } from '../dto/list-supplies.dto';
import { SupplyRepository } from '../supply.repository';

@Injectable()
export class SupplyService {
  constructor(private readonly repository: SupplyRepository) {}

  async assertActiveInTransaction(tx: Prisma.TransactionClient, ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    const supplies = await this.repository.findActiveByIds(tx, uniqueIds);
    if (supplies.length !== uniqueIds.length)
      throw new DomainError('SUPPLY_NOT_FOUND');
  }

  async findByIdInTransaction(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<SupplyDomain | null> {
    const supply = await this.repository.findById(id, tx);
    return supply ? SupplyDomain.fromPrisma(supply) : null;
  }

  changeBalanceInTransaction(
    tx: Prisma.TransactionClient,
    id: string,
    type: 'IN' | 'OUT',
    quantity: number,
    maximumBeforeEntry: number,
  ) {
    return this.repository.changeBalance(
      tx,
      id,
      type,
      quantity,
      maximumBeforeEntry,
    );
  }

  create(dto: CreateSupplyDto) {
    return withHttpErrors(async () => {
      const initial =
        dto.currentQuantity === undefined
          ? {}
          : { currentQuantity: dto.currentQuantity };
      return SupplyDomain.fromPrisma(
        await this.repository.create({
          name: dto.name,
          description: dto.description,
          unit: dto.unit,
          ...initial,
        }),
      );
    });
  }

  findAll(query: ListSuppliesDto) {
    return withHttpErrors(async () => {
      const { data, total } = await this.repository.findAll(query);
      return {
        data: SupplyDomain.fromPrismaMany(data),
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    });
  }

  findOne(id: string) {
    return withHttpErrors(async () => {
      const supply = await this.repository.findById(id);
      if (!supply) throw new DomainError('SUPPLY_NOT_FOUND');
      return SupplyDomain.fromPrisma(supply);
    });
  }

  update(id: string, dto: UpdateSupplyDto) {
    return withHttpErrors(async () =>
      SupplyDomain.fromPrisma(
        await this.repository.update(id, {
          name: dto.name,
          description: dto.description,
          unit: dto.unit,
        }),
      ),
    );
  }

  remove(id: string) {
    return withHttpErrors(async () => {
      await this.repository.softDelete(id);
    });
  }
}
