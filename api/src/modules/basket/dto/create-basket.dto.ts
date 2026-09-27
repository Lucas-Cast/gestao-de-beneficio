import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  MAX_INTEGER_VALUE,
  MIN_POSITIVE_INTEGER,
} from '../../../common/domain/integer-limits';

export class CreateBasketSupplyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Informe um identificador válido de mantimento.' })
  supplyId!: string;

  @ApiProperty({
    minimum: MIN_POSITIVE_INTEGER,
    maximum: MAX_INTEGER_VALUE,
    example: 2,
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(MIN_POSITIVE_INTEGER, {
    message: 'A quantidade deve ser maior que zero.',
  })
  @Max(MAX_INTEGER_VALUE, {
    message: 'A quantidade ultrapassa o limite permitido.',
  })
  quantity!: number;
}

export class CreateBasketDto {
  @ApiProperty({ example: 'Cesta básica' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(1, { message: 'Informe o nome da cesta.' })
  @MaxLength(200, { message: 'O nome pode ter no máximo 200 caracteres.' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(2000, {
    message: 'A descrição pode ter no máximo 2000 caracteres.',
  })
  description?: string | null;

  @ApiProperty({ type: [CreateBasketSupplyDto], minItems: 1 })
  @IsArray({ message: 'Os mantimentos devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'A cesta deve conter pelo menos um mantimento.' })
  @ArrayUnique((item: CreateBasketSupplyDto | null) => item?.supplyId, {
    message: 'Cada mantimento deve aparecer uma única vez na cesta.',
  })
  @ValidateNested({
    each: true,
    message: 'Informe itens válidos para a cesta.',
  })
  @Type(() => CreateBasketSupplyDto)
  supplies!: CreateBasketSupplyDto[];
}
