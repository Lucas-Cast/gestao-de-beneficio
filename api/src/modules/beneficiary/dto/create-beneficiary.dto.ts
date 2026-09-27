import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateBy,
  ValidateNested,
} from 'class-validator';
import {
  BENEFICIARY_SEXES,
  BeneficiarySex,
  isValidBirthDate,
  isValidCpf,
} from '../domain/beneficiary.validation';
import { CreateAddressDto } from './address.dto';

export class CreateBeneficiaryDto {
  @ApiProperty({ example: 'Ana Souza' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(1, { message: 'Informe o nome do beneficiário.' })
  @MaxLength(200, { message: 'O nome pode ter no máximo 200 caracteres.' })
  name!: string;

  @ApiProperty({ type: String, format: 'date', example: '1990-01-01' })
  @ValidateBy(
    {
      name: 'birthDate',
      validator: {
        validate: (value: unknown) => isValidBirthDate(value, new Date()),
      },
    },
    {
      message:
        'Informe uma data de nascimento válida, no formato AAAA-MM-DD, que não esteja no futuro.',
    },
  )
  birthDate!: string;

  @ApiProperty({ enum: BENEFICIARY_SEXES })
  @IsIn(BENEFICIARY_SEXES, { message: 'O sexo deve ser M ou F.' })
  sex!: BeneficiarySex;

  @ApiProperty({ example: '91999999999' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[()+\s-]/g, '') : value,
  )
  @Matches(/^(?:55)?\d{10,11}$/, {
    message:
      'Informe um telefone com DDD, com 10 ou 11 dígitos, opcionalmente precedido por 55.',
  })
  phone!: string;

  @ApiProperty({ example: '52998224725' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[.\s-]/g, '') : value,
  )
  @ValidateBy(
    { name: 'cpf', validator: { validate: isValidCpf } },
    { message: 'Informe um CPF válido.' },
  )
  cpf!: string;

  @ApiProperty({ type: CreateAddressDto })
  @IsObject({ message: 'Informe um endereço válido.' })
  @ValidateNested({ message: 'Informe um endereço válido.' })
  @Type(() => CreateAddressDto)
  address!: CreateAddressDto;
}
