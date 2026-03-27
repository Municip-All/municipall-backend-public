import { Controller, Get, Post } from '@nestjs/common';
import { ReportServices } from './report.services';

@Controller()
export class ReportController {
  constructor(private readonly appService: ReportServices) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  getNice(): string {
    return this.appService.getNice();
  }
}
