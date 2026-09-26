import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { MOVEMENT_TYPES, MovementType } from '../domain/stock-movement.domain';

export class ListStockMovementsDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', {
    message: 'Informe um identificador válido para o mantimento.',
  })
  supplyId?: string;

  @ApiPropertyOptional({ enum: MOVEMENT_TYPES })
  @IsOptional()
  @IsIn(MOVEMENT_TYPES, { message: 'O tipo do movimento deve ser IN ou OUT.' })
  type?: MovementType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'Informe um identificador válido para o usuário.' })
  performedById?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'Informe um identificador válido para a entrega.' })
  basketDeliveryId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Início inclusivo do intervalo de criação.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Informe uma data inicial válida.' })
  from?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Fim inclusivo do intervalo de criação.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Informe uma data final válida.' })
  to?: Date;
}
