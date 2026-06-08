import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DockerService } from './docker.service';
import { DatabaseService } from './database.service';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import { Invitation } from './entities/invitation.entity';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, City, Invitation]), StaffModule],
  controllers: [AdminController],
  providers: [AdminService, DockerService, DatabaseService],
})
export class AdminModule {}
