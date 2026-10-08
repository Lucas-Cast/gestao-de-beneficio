import { ApiProperty } from '@nestjs/swagger';

export class BasketDeliveryStatsResponseDto {
  @ApiProperty({ example: 12 }) basketsDeliveredToday!: number;
  @ApiProperty({ example: 10 }) beneficiariesAttendedToday!: number;
  @ApiProperty({ example: 148 }) basketsDeliveredThisMonth!: number;
}
