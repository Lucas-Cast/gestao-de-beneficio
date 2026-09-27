import { ApiProperty } from '@nestjs/swagger';
import {
  BENEFICIARY_SEXES,
  BeneficiarySex,
} from '../domain/beneficiary.validation';

export class AddressResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() street!: string;
  @ApiProperty() number!: string;
  @ApiProperty({ type: String, nullable: true }) complement!: string | null;
  @ApiProperty() neighborhood!: string;
  @ApiProperty() city!: string;
  @ApiProperty() state!: string;
  @ApiProperty() postalCode!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class BeneficiaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, format: 'date' }) birthDate!: string;
  @ApiProperty({ enum: BENEFICIARY_SEXES }) sex!: BeneficiarySex;
  @ApiProperty() phone!: string;
  @ApiProperty() cpf!: string;
  @ApiProperty({ type: AddressResponseDto }) address!: AddressResponseDto;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: Date, nullable: true }) deletedAt!: Date | null;
}

export class BeneficiaryPageDto {
  @ApiProperty({ type: [BeneficiaryResponseDto] })
  data!: BeneficiaryResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
