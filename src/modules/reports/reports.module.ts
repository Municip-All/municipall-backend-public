import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { ReportMessage } from './entities/report-message.entity';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { AiEngineModule } from '../ai-engine/ai-engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportMessage, User, City]),
    NotificationsModule,
    FeedbackModule,
    AiEngineModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
