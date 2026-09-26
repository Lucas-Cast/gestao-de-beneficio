import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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

export class CreateBasketDeliveryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', {
    message: 'Informe um identificador válido para o beneficiário.',
  })
  beneficiaryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Informe um identificador válido para a cesta.' })
  basketId!: string;

  @ApiPropertyOptional({
    default: MIN_POSITIVE_INTEGER,
    minimum: MIN_POSITIVE_INTEGER,
  })
  @IsInt({ message: 'A quantidade de cestas deve ser um número inteiro.' })
  @Min(MIN_POSITIVE_INTEGER, {
    message: 'A quantidade de cestas deve ser maior que zero.',
  })
  @Max(MAX_INTEGER_VALUE, {
    message: 'A quantidade de cestas ultrapassa o limite permitido.',
  })
  quantity: number = MIN_POSITIVE_INTEGER;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'A observação deve ser um texto.' })
  @MaxLength(2000, {
    message: 'A observação pode ter no máximo 2000 caracteres.',
  })
  observation?: string | null;
}
