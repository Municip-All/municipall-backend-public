import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiOperation({ summary: 'Get current weather by coordinates' })
  async getWeather(@Query('lat') latRaw: string, @Query('lon') lonRaw: string) {
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('lat et lon sont requis');
    }
    const result = await this.weatherService.getWeather(lat, lon);
    if ('error' in result && result.error) {
      throw new BadRequestException(result.error);
    }
    return result;
  }
}
