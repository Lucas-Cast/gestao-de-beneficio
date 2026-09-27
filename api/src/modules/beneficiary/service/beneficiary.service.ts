import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { withHttpErrors } from '../../../common/errors/to-http-exception';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/service/audit.service';
import { BeneficiaryRepository } from '../beneficiary.repository';
import { BeneficiaryDomain } from '../domain/beneficiary.domain';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import { ListBeneficiariesDto } from '../dto/list-beneficiaries.dto';

@Injectable()
export class BeneficiaryService {
  constructor(
    private readonly database: DatabaseService,
    private readonly repository: BeneficiaryRepository,
    private readonly audit: AuditService,
  ) {}

  async findByIdInTransaction(tx: Prisma.TransactionClient, id: string) {
    const record = await this.repository.findById(id, tx);
    return record ? BeneficiaryDomain.fromPrisma(record) : null;
  }

  create(dto: CreateBeneficiaryDto, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(async (tx) => {
        const beneficiary = BeneficiaryDomain.fromPrisma(
          await this.repository.create(tx, {
            name: dto.name,
            birthDate: new Date(dto.birthDate + 'T00:00:00.000Z'),
            sex: dto.sex,
            phone: dto.phone,
            cpf: dto.cpf,
            address: { create: dto.address },
          }),
        );
        await this.audit.record(
          tx,
          'BENEFICIARY',
          beneficiary.id,
          null,
          beneficiary,
          actorId,
        );
        return beneficiary;
      }),
    );
  }

  findAll(query: ListBeneficiariesDto) {
    return withHttpErrors(async () => {
      const { data, total } = await this.repository.findAll(query);
      return {
        data: BeneficiaryDomain.fromPrismaMany(data),
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    });
  }

  findOne(id: string) {
    return withHttpErrors(async () => {
      const record = await this.repository.findById(id);
      if (!record) throw new DomainError('BENEFICIARY_NOT_FOUND');
      return BeneficiaryDomain.fromPrisma(record);
    });
  }

  update(id: string, dto: UpdateBeneficiaryDto, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(
        async (tx) => {
          const before = await this.findByIdInTransaction(tx, id);
          if (!before) throw new DomainError('BENEFICIARY_NOT_FOUND');
          const after = BeneficiaryDomain.fromPrisma(
            await this.repository.update(tx, id, {
              name: dto.name,
              birthDate:
                dto.birthDate === undefined
                  ? undefined
                  : new Date(dto.birthDate + 'T00:00:00.000Z'),
              sex: dto.sex,
              phone: dto.phone,
              cpf: dto.cpf,
              address:
                dto.address === undefined ? undefined : { update: dto.address },
            }),
          );
          await this.audit.record(
            tx,
            'BENEFICIARY',
            id,
            before,
            after,
            actorId,
          );
          return after;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  remove(id: string, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(
        async (tx) => {
          const before = await this.findByIdInTransaction(tx, id);
          if (!before) throw new DomainError('BENEFICIARY_NOT_FOUND');
          const after = BeneficiaryDomain.fromPrisma(
            await this.repository.softDelete(tx, id),
          );
          await this.audit.record(
            tx,
            'BENEFICIARY',
            id,
            before,
            after,
            actorId,
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
}
