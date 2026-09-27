import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { SupplyModule } from '../supply/supply.module';
import { AuditModule } from '../audit/audit.module';
import { BasketRepository } from './basket.repository';
import { BasketService } from './service/basket.service';
import { BasketController } from './basket.controller';

@Module({
  imports: [UserModule, SupplyModule, AuditModule],
  controllers: [BasketController],
  providers: [BasketRepository, BasketService],
  exports: [BasketService],
})
export class BasketModule {}
