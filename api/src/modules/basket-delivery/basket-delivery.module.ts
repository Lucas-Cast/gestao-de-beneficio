import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { BasketDeliveryController } from './basket-delivery.controller';
import { BasketDeliveryRepository } from './basket-delivery.repository';
import { BasketDeliveryService } from './service/basket-delivery.service';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { BasketModule } from '../basket/basket.module';

@Module({
  imports: [UserModule, StockMovementModule, BeneficiaryModule, BasketModule],
  controllers: [BasketDeliveryController],
  providers: [BasketDeliveryRepository, BasketDeliveryService],
})
export class BasketDeliveryModule {}
