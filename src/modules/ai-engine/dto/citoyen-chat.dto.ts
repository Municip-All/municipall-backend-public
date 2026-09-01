import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CitoyenChatDto {
  @ApiProperty({ description: 'Identifiant de session citoyen', maxLength: 128 })
  @IsString()
  @Length(1, 128)
  user_id!: string;

  @ApiProperty({ description: 'Message du citoyen', maxLength: 5000 })
  @IsString()
  @Length(1, 5000)
  message!: string;

  @ApiPropertyOptional({ description: 'Ville (tenant) du citoyen', maxLength: 128 })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  tenant_id?: string;
}
