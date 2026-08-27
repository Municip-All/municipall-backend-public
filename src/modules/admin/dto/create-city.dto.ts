import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CityIntegrationType {
  WIDGET = 'widget',
  MOBILE_APP = 'mobile_app',
  BOTH = 'both',
}

class NeighborhoodDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsArray()
  points!: [number, number][];
}

export class CreateCityDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  primaryColor!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useGradient?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactHelpText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataRetentionPolicy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractSignedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipalityContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipalityContactRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipalityContactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipalityContactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTechName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTechEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesRepName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesRepEmail?: string;

  @ApiPropertyOptional({ enum: CityIntegrationType })
  @IsOptional()
  @IsEnum(CityIntegrationType)
  integrationType?: CityIntegrationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTransportFeatureAllowed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTransportFeatureEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  boundary?: unknown;

  @ApiPropertyOptional({ type: [NeighborhoodDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NeighborhoodDto)
  neighborhoods?: NeighborhoodDto[];
}
