import { ApiProperty } from '@nestjs/swagger';
import { UserDomain } from '../../user/domain/user.domain';
import { AUDIT_ENTITY_TYPES, AuditEntity } from '../domain/audit.domain';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: AUDIT_ENTITY_TYPES }) entityType!: AuditEntity;
  @ApiProperty({ format: 'uuid' }) entityId!: string;
  @ApiProperty({ type: Object, nullable: true })
  from!: Record<string, unknown> | null;
  @ApiProperty({ type: Object, nullable: true })
  to!: Record<string, unknown> | null;
  @ApiProperty({ type: UserDomain }) changedBy!: UserDomain;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class AuditLogPageDto {
  @ApiProperty({ type: [AuditLogResponseDto] }) data!: AuditLogResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
