import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, ValidateIf, ValidateNested } from 'class-validator';
import { CreateBeneficiaryDto } from './create-beneficiary.dto';
import { UpdateAddressDto } from './address.dto';

export class UpdateBeneficiaryDto extends PartialType(
  OmitType(CreateBeneficiaryDto, ['address'] as const),
  { skipNullProperties: false },
) {
  @ApiPropertyOptional({ type: UpdateAddressDto })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsObject({ message: 'Informe um endereço válido.' })
  @ValidateNested({ message: 'Informe um endereço válido.' })
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;
}
