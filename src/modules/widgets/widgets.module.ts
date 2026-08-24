import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';
import { ReportsModule } from '../reports/reports.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [ReportsModule, WeatherModule],
  controllers: [WidgetsController],
  providers: [WidgetsService],
})
export class WidgetsModule {}
