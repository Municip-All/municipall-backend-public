import { Controller, Get, Param, Query, ParseFloatPipe, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { CityConfigService } from '../city-config/city-config.service';
import { TransportService } from './transport.service';

@ApiTags('municipalities')
@Controller('municipalities')
export class TransportController {
  constructor(
    private readonly transportService: TransportService,
    private readonly cityConfigService: CityConfigService,
  ) {}

  @Public()
  @Get(':id/transports/disruptions')
  @ApiOperation({
    summary: 'Perturbations transports en commun à proximité (proxy IDFM / PRIM)',
  })
  async getDisruptions(
    @Param('id') cityId: string,
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
  ) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('lat et lon sont requis');
    }
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new BadRequestException('Coordonnées GPS invalides');
    }

    await this.cityConfigService.assertTransportAccess(cityId);
    return this.transportService.getDisruptionsNear(lat, lon);
  }
}
