import { Controller, Get, Param } from '@nestjs/common';
import { CityConfigService, CityConfig } from './city-config.service';

@Controller('city-config')
export class CityConfigController {
  constructor(private readonly cityConfigService: CityConfigService) {}

  @Get(':cityId')
  async getConfig(@Param('cityId') cityId: string): Promise<CityConfig> {
    return this.cityConfigService.getCityConfig(cityId);
  }
}
