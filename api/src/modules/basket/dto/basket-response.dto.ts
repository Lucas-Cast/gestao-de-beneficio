import { ApiProperty } from '@nestjs/swagger';
import { SupplyResponseDto } from '../../supply/dto/supply-response.dto';

export class BasketSupplyResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ type: SupplyResponseDto }) supply!: SupplyResponseDto;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: Date, nullable: true }) deletedAt!: Date | null;
}

export class BasketResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: [BasketSupplyResponseDto] })
  supplies!: BasketSupplyResponseDto[];
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: Date, nullable: true }) deletedAt!: Date | null;
}

export class BasketPageDto {
  @ApiProperty({ type: [BasketResponseDto] }) data!: BasketResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
