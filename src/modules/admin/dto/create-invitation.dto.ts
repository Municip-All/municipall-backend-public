import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

const INVITATION_ROLES = ['mayor', 'assistant', 'agent'] as const;

export class CreateInvitationDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: INVITATION_ROLES })
  @IsOptional()
  @IsIn([...INVITATION_ROLES])
  role?: string;
}
