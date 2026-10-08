import { ApiProperty } from '@nestjs/swagger';
import { BeneficiaryResponseDto } from '../../beneficiary/dto/beneficiary-response.dto';
import { BasketResponseDto } from '../../basket/dto/basket-response.dto';
import { StockMovementResponseDto } from '../../stock-movement/dto/stock-movement-response.dto';
import { UserDomain } from '../../user/domain/user.domain';

export class BasketDeliveryHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ type: String, nullable: true }) observation!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: BeneficiaryResponseDto })
  beneficiary!: BeneficiaryResponseDto;
  @ApiProperty({ type: BasketResponseDto }) basket!: BasketResponseDto;
  @ApiProperty({ type: UserDomain }) deliveredBy!: UserDomain;
  @ApiProperty({ type: [StockMovementResponseDto] })
  stockMovements!: StockMovementResponseDto[];
}

export class BasketDeliveryHistoryPageDto {
  @ApiProperty({ type: [BasketDeliveryHistoryResponseDto] })
  data!: BasketDeliveryHistoryResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
