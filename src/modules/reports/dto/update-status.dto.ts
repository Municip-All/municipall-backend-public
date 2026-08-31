import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const REPORT_STATUSES = ['En attente', 'En cours', 'Résolu', 'Clôturé'] as const;

export class UpdateReportStatusDto {
  @ApiProperty({ enum: REPORT_STATUSES })
  @IsIn([...REPORT_STATUSES])
  status!: string;
}
