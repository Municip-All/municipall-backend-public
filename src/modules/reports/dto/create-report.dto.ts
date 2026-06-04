import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ description: 'Category of the report', example: 'Voirie' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: 'Description of the problem',
    example: 'Nid de poule sur la chaussée',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'URL of the evidence image',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'User ID (optional)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: 'Longitude', example: 2.3522 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lon!: number;

  @ApiProperty({ description: 'Latitude', example: 48.8566 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat!: number;

  @ApiProperty({ description: 'Status (optional)', example: 'En attente', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
