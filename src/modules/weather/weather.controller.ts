import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiOperation({ summary: 'Get current weather by coordinates' })
  getWeather(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
  ) {
    return this.weatherService.getWeather(lat, lon);
  }
}
