import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuditController } from './audit.controller';
import { AuditRepository } from './audit.repository';
import { AuditService } from './service/audit.service';

@Module({
  imports: [UserModule],
  controllers: [AuditController],
  providers: [AuditRepository, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
