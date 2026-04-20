import { Controller } from '@nestjs/common';
import { WeeklyReportServices } from './weekly_report.services';

@Controller()
export class WeekyReportConrtoller {
  constructor(private readonly appService: WeeklyReportServices) {}
}
