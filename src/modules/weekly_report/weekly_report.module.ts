import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyReport } from './weekly_report.entity';
import { WeeklyReportServices } from './weekly_report.services';
import { WeekyReportConrtoller } from './weekly_report.controller';
import { WeeklyReportRepository } from './weekly_report.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WeeklyReport])],
  controllers: [WeekyReportConrtoller],
  providers: [WeeklyReportServices, WeeklyReportRepository],
  exports: [WeeklyReportServices],
})
export class WeeklyReportModule {}
