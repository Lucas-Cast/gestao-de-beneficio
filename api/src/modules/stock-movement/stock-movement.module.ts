import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { SupplyModule } from '../supply/supply.module';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementRepository } from './stock-movement.repository';
import { StockMovementService } from './service/stock-movement.service';

@Module({
  imports: [UserModule, SupplyModule],
  controllers: [StockMovementController],
  providers: [StockMovementRepository, StockMovementService],
  exports: [StockMovementService],
})
export class StockMovementModule {}
