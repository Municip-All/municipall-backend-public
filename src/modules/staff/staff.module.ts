import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { User } from '../user/user.entity';
import { Invitation } from '../admin/entities/invitation.entity';
import { Report } from '../reports/entities/report.entity';
import { City } from '../city-config/entities/city.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Invitation, Report, City]), AuthModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
