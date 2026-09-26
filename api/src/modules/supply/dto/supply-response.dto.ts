import { ApiProperty } from '@nestjs/swagger';
import { SUPPLY_UNITS, SupplyUnit } from '../domain/supply.domain';

export class SupplyResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ enum: SUPPLY_UNITS }) unit!: SupplyUnit;
  @ApiProperty({ example: 10 }) currentQuantity!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: Date, nullable: true }) deletedAt!: Date | null;
}

export class SupplyPageDto {
  @ApiProperty({ type: [SupplyResponseDto] }) data!: SupplyResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
