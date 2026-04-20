import { Controller, Get, Param } from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('widgets')
@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get(':cityId')
  async getWidgetsData(@Param('cityId') cityId: string) {
    return this.widgetsService.getAggregatedData(cityId);
  }
}
