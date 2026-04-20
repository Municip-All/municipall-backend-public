import { Module } from '@nestjs/common';
import { CityConfigController } from './city-config.controller';
import { CityConfigService } from './city-config.service';

@Module({
  controllers: [CityConfigController],
  providers: [CityConfigService],
  exports: [CityConfigService],
})
export class CityConfigModule {}
