import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstructionWorksService } from './construction-works.service';
import { ConstructionWorksController } from './construction-works.controller';
import { ConstructionWork } from './entities/construction-work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConstructionWork])],
  controllers: [ConstructionWorksController],
  providers: [ConstructionWorksService],
  exports: [ConstructionWorksService],
})
export class ConstructionWorksModule {}
