import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  avatarUrl!: string;
}
