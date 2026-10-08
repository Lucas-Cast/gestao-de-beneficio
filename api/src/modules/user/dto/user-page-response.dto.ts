import { ApiProperty } from '@nestjs/swagger';
import { UserDomain } from '../domain/user.domain';

export class UserPageResponseDto {
  @ApiProperty({ type: [UserDomain] })
  data!: UserDomain[];

  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
