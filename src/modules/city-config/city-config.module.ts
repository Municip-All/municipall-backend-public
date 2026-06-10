import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityConfigController } from './city-config.controller';
import { CityConfigService } from './city-config.service';
import { City } from './entities/city.entity';

import { Report } from '../reports/entities/report.entity';
import { User } from '../user/user.entity';
import { ContactTicket } from '../contact-messages/entities/contact-ticket.entity';
import { ContactTicketMessage } from '../contact-messages/entities/contact-ticket-message.entity';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([City, Report, User, ContactTicket, ContactTicketMessage]),
    FeedbackModule,
  ],
  controllers: [CityConfigController],
  providers: [CityConfigService],
  exports: [CityConfigService],
})
export class CityConfigModule {}
