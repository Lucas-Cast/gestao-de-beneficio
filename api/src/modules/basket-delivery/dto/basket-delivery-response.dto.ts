import { ApiProperty } from '@nestjs/swagger';
import { StockMovementResponseDto } from '../../stock-movement/dto/stock-movement-response.dto';

export class BasketDeliveryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) beneficiaryId!: string;
  @ApiProperty({ format: 'uuid' }) basketId!: string;
  @ApiProperty({ format: 'uuid' }) deliveredById!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ type: String, nullable: true }) observation!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [StockMovementResponseDto] })
  stockMovements!: StockMovementResponseDto[];
}
