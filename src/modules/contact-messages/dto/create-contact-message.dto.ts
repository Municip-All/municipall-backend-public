import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Question sur les horaires' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @ApiProperty({ example: "Bonjour, je souhaiterais connaître les horaires d'ouverture..." })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  body!: string;

  @ApiPropertyOptional({ enum: ['question', 'suggestion'], default: 'question' })
  @IsOptional()
  @IsIn(['question', 'suggestion'])
  ticketType?: 'question' | 'suggestion';
}
