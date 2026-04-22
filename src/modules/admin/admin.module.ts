import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DockerService } from './docker.service';
import { DatabaseService } from './database.service';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, City])],
  controllers: [AdminController],
  providers: [AdminService, DockerService, DatabaseService],
})
export class AdminModule {}
