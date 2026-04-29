import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConstructionWorkDto {
  @ApiProperty({ example: 'Réfection chaussée' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: "Travaux de voirie sur l'avenue" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Avenue de la République' })
  @IsString()
  @IsNotEmpty()
  locationName!: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ example: '2026-05-15' })
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  endDate!: Date;

  @ApiProperty({ example: 'Programmé' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Circulation alternée' })
  @IsString()
  @IsOptional()
  impactType?: string;
}
