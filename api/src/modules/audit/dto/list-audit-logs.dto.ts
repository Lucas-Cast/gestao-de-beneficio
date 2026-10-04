import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AUDIT_ENTITY_TYPES, AuditEntity } from '../domain/audit.domain';

export class ListAuditLogsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: AUDIT_ENTITY_TYPES })
  @IsOptional()
  @IsIn(AUDIT_ENTITY_TYPES, {
    message: 'O tipo da entidade deve ser BENEFICIARY ou BASKET.',
  })
  entityType?: AuditEntity;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', {
    message: 'Informe um identificador válido para a entidade.',
  })
  entityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'Informe um identificador válido para o usuário.' })
  changedById?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Informe uma data inicial válida.' })
  from?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Informe uma data final válida.' })
  to?: Date;
}
