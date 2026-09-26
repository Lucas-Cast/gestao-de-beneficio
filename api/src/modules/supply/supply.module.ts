import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { SupplyController } from './supply.controller';
import { SupplyRepository } from './supply.repository';
import { SupplyService } from './service/supply.service';

@Module({
  imports: [UserModule],
  controllers: [SupplyController],
  providers: [SupplyRepository, SupplyService],
  exports: [SupplyService],
})
export class SupplyModule {}
