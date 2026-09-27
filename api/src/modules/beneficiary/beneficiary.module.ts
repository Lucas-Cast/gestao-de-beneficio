import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuditModule } from '../audit/audit.module';
import { BeneficiaryController } from './beneficiary.controller';
import { BeneficiaryRepository } from './beneficiary.repository';
import { BeneficiaryService } from './service/beneficiary.service';

@Module({
  imports: [UserModule, AuditModule],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryRepository, BeneficiaryService],
  exports: [BeneficiaryService],
})
export class BeneficiaryModule {}
