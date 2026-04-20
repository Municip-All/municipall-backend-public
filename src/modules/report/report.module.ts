import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportServices } from './report.services';
import { ReportRepository } from './report.repository';
import { Report } from './report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  controllers: [ReportController],
  providers: [ReportServices, ReportRepository],
  exports: [ReportServices],
})
export class ReportModule {}
