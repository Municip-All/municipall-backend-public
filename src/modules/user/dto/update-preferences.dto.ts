import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  moderationAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklyReports?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  citizenEngagement?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  systemMaintenance?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  contactInbox?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  teamActivity?: boolean;
}
