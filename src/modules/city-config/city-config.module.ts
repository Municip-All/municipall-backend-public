import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityConfigController } from './city-config.controller';
import { CityConfigService } from './city-config.service';
import { City } from './entities/city.entity';

import { Report } from '../reports/entities/report.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([City, Report, User])],
  controllers: [CityConfigController],
  providers: [CityConfigService],
  exports: [CityConfigService],
})
export class CityConfigModule {}
