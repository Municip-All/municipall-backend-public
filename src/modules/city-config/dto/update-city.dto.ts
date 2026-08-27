import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsArray, IsObject } from 'class-validator';

export class UpdateCityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataRetentionPolicy?: string;

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
  primaryColor?: string;

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
  backgroundColorLight?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backgroundColorDark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  neighborhoods?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  wasteConfig?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTransportFeatureEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  associations?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  publicProfile?: unknown;
}
