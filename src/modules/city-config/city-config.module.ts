import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityConfigController } from './city-config.controller';
import { CityConfigService } from './city-config.service';
import { City } from './entities/city.entity';

@Module({
  imports: [TypeOrmModule.forFeature([City])],
  controllers: [CityConfigController],
  providers: [CityConfigService],
  exports: [CityConfigService],
})
export class CityConfigModule {}
