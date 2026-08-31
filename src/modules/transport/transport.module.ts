import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CityConfigModule } from '../city-config/city-config.module';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';

@Module({
  imports: [ConfigModule, CityConfigModule],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
