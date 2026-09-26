import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_INTEGER_VALUE,
  MIN_POSITIVE_INTEGER,
} from '../../../common/domain/integer-limits';
import { MOVEMENT_TYPES, MovementType } from '../domain/stock-movement.domain';

export class CreateStockMovementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', {
    message: 'Informe um identificador válido para o mantimento.',
  })
  supplyId!: string;

  @ApiProperty({ enum: MOVEMENT_TYPES })
  @IsIn(MOVEMENT_TYPES, { message: 'O tipo do movimento deve ser IN ou OUT.' })
  type!: MovementType;

  @ApiProperty({ type: Number, example: 2, minimum: MIN_POSITIVE_INTEGER })
  @IsInt({ message: 'A quantidade do movimento deve ser um número inteiro.' })
  @Min(MIN_POSITIVE_INTEGER, {
    message: 'A quantidade do movimento deve ser maior que zero.',
  })
  @Max(MAX_INTEGER_VALUE, {
    message: 'A quantidade do movimento ultrapassa o limite permitido.',
  })
  quantity!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'O motivo deve ser um texto.' })
  @MaxLength(2000, { message: 'O motivo pode ter no máximo 2000 caracteres.' })
  reason?: string | null;
}
