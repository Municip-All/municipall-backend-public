import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  ParseFloatPipe,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CityConfigService, CityConfig } from './city-config.service';
import { Public } from '../../core/decorators/public.decorator';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('city-config')
@Controller('city-config')
export class CityConfigController {
  constructor(private readonly cityConfigService: CityConfigService) {}

  @Public()
  @Get()
  async listCities() {
    return this.cityConfigService.findAllActive();
  }

  @Public()
  @Get('detect')
  async detectCity(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
  ) {
    const city = await this.cityConfigService.findByLocation(lat, lon);
    if (!city) {
      throw new NotFoundException('No partner city found at this location');
    }
    const config = await this.cityConfigService.getCityConfig(city.id);
    return {
      id: city.id,
      ...config,
    };
  }

  @Public()
  @Get(':cityId')
  async getConfig(@Param('cityId') cityId: string): Promise<CityConfig> {
    return this.cityConfigService.getCityConfig(cityId);
  }

  @RequirePermissions(Permission.CITY_CONFIG_READ)
  @ApiBearerAuth()
  @Get(':cityId/boundary')
  @ApiOperation({ summary: 'Contour communal (GeoJSON) pour cartes backoffice' })
  async getBoundary(@Param('cityId') cityId: string) {
    const feature = await this.cityConfigService.getCityBoundaryGeoJson(cityId);
    if (!feature) {
      throw new NotFoundException('Contour communal non disponible');
    }
    return feature;
  }

  @RequirePermissions(Permission.CITY_CONFIG_READ)
  @ApiBearerAuth()
  @Get(':cityId/dashboard-stats')
  async getDashboardStats(@Param('cityId') cityId: string) {
    return this.cityConfigService.getDashboardStats(cityId);
  }

  @RequirePermissions(Permission.CITY_CONFIG_WRITE)
  @ApiBearerAuth()
  @Patch(':cityId')
  @ApiOperation({ summary: 'Mettre à jour la configuration ville (maire)' })
  async updateConfig(
    @Param('cityId') cityId: string,
    @Body() data: Record<string, unknown>,
    @Req() req: Request & { user?: { sub: number } },
  ) {
    return this.cityConfigService.updateCityConfig(cityId, data, req.user?.sub);
  }
}
