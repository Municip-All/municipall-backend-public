import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DockerService } from './docker.service';
import { DatabaseService } from './database.service';
import { DemoSeedService } from './demo-seed.service';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import { Invitation } from './entities/invitation.entity';
import { StaffModule } from '../staff/staff.module';
import { AuditModule } from '../audit/audit.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, City, Invitation]),
    StaffModule,
    AuditModule,
    FeedbackModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, DockerService, DatabaseService, DemoSeedService],
})
export class AdminModule {}
