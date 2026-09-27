import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { createValidationPipe } from './common/validation/create-validation-pipe';
import { SupplyModule } from './modules/supply/supply.module';
import { StockMovementModule } from './modules/stock-movement/stock-movement.module';
import { BasketDeliveryModule } from './modules/basket-delivery/basket-delivery.module';
import { AuditModule } from './modules/audit/audit.module';
import { BeneficiaryModule } from './modules/beneficiary/beneficiary.module';
import { BasketModule } from './modules/basket/basket.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    SupplyModule,
    StockMovementModule,
    BasketDeliveryModule,
    AuditModule,
    BeneficiaryModule,
    BasketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule {}
