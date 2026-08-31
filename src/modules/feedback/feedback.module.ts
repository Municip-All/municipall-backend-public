import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenFeedback } from './entities/citizen-feedback.entity';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { Report } from '../reports/entities/report.entity';
import { ContactTicket } from '../contact-messages/entities/contact-ticket.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CitizenFeedback, Report, ContactTicket, User])],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
