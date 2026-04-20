import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsNotEmpty()
  // Allow any string for now since it might be a local URI for the MVP
  // @IsUrl() 
  avatarUrl!: string;
}
