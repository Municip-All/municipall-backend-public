import { Controller, Get, Param, Query, ParseFloatPipe, NotFoundException } from '@nestjs/common';
import { CityConfigService, CityConfig } from './city-config.service';

@Controller('city-config')
export class CityConfigController {
  constructor(private readonly cityConfigService: CityConfigService) {}

  @Get('detect')
  async detectCity(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
  ) {
    const city = await this.cityConfigService.findByLocation(lat, lon);
    if (!city) {
      throw new NotFoundException('No partner city found at this location');
    }
    // Return city ID and its config
    const config = await this.cityConfigService.getCityConfig(city.id);
    return {
      id: city.id,
      ...config,
    };
  }

  @Get(':cityId')
  async getConfig(@Param('cityId') cityId: string): Promise<CityConfig> {
    return this.cityConfigService.getCityConfig(cityId);
  }
}
