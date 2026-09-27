import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BRAZILIAN_STATES } from '../domain/beneficiary.validation';

export class CreateAddressDto {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'A rua deve ser um texto.' })
  @MinLength(1, { message: 'Informe a rua.' })
  @MaxLength(200, { message: 'A rua pode ter no máximo 200 caracteres.' })
  street!: string;

  @ApiProperty({ example: '15' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O número do endereço deve ser um texto.' })
  @MinLength(1, { message: 'Informe o número do endereço.' })
  @MaxLength(30, { message: 'O número pode ter no máximo 30 caracteres.' })
  number!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString({ message: 'O complemento deve ser um texto.' })
  @MaxLength(200, {
    message: 'O complemento pode ter no máximo 200 caracteres.',
  })
  complement?: string | null;

  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O bairro deve ser um texto.' })
  @MinLength(1, { message: 'Informe o bairro.' })
  @MaxLength(200, { message: 'O bairro pode ter no máximo 200 caracteres.' })
  neighborhood!: string;

  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'A cidade deve ser um texto.' })
  @MinLength(1, { message: 'Informe a cidade.' })
  @MaxLength(200, { message: 'A cidade pode ter no máximo 200 caracteres.' })
  city!: string;

  @ApiProperty({ enum: BRAZILIAN_STATES, example: 'PA' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(BRAZILIAN_STATES, { message: 'Informe uma UF válida.' })
  state!: string;

  @ApiProperty({ example: '66000000' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[-\s]/g, '') : value,
  )
  @Matches(/^\d{8}$/, { message: 'O CEP deve conter 8 dígitos.' })
  postalCode!: string;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto, {
  skipNullProperties: false,
}) {}
