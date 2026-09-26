import { ApiProperty } from '@nestjs/swagger';
import { MOVEMENT_TYPES, MovementType } from '../domain/stock-movement.domain';
import { SupplyResponseDto } from '../../supply/dto/supply-response.dto';
import { UserDomain } from '../../user/domain/user.domain';

export class StockMovementResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  basketDeliveryId!: string | null;
  @ApiProperty({ enum: MOVEMENT_TYPES }) type!: MovementType;
  @ApiProperty({ example: 2 }) quantity!: number;
  @ApiProperty({ type: String, nullable: true }) reason!: string | null;
  @ApiProperty({ type: SupplyResponseDto }) supply!: SupplyResponseDto;
  @ApiProperty({ type: UserDomain }) performedBy!: UserDomain;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: Date, nullable: true }) deletedAt!: Date | null;
}

export class StockMovementPageDto {
  @ApiProperty({ type: [StockMovementResponseDto] })
  data!: StockMovementResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
