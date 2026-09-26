import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { MAX_INTEGER_VALUE } from '../../../common/domain/integer-limits';
import { SUPPLY_UNITS, SupplyUnit } from '../domain/supply.domain';

export class CreateSupplyDto {
  @ApiProperty({ example: 'Arroz' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(1, { message: 'Informe o nome do mantimento.' })
  @MaxLength(200, { message: 'O nome pode ter no máximo 200 caracteres.' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(2000, {
    message: 'A descrição pode ter no máximo 2000 caracteres.',
  })
  description?: string | null;

  @ApiProperty({ enum: SUPPLY_UNITS, example: 'KILOGRAM' })
  @IsIn(SUPPLY_UNITS, { message: 'Selecione uma unidade de medida válida.' })
  unit!: SupplyUnit;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    minimum: 0,
    maximum: MAX_INTEGER_VALUE,
    description: 'Saldo inicial inteiro; omitido usa o padrão 0 do banco.',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt({ message: 'O saldo inicial deve ser um número inteiro.' })
  @Min(0, { message: 'O saldo inicial deve ser maior ou igual a zero.' })
  @Max(MAX_INTEGER_VALUE, {
    message: 'O saldo inicial ultrapassa o limite permitido.',
  })
  currentQuantity?: number;
}
