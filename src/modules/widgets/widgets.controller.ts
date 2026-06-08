import { Controller, Get, Param } from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('widgets')
@Public()
@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get(':cityId')
  getWidgetsData(@Param('cityId') cityId: string) {
    return this.widgetsService.getAggregatedData(cityId);
  }
}
