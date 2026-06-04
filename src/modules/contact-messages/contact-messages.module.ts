import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactTicket } from './entities/contact-ticket.entity';
import { ContactTicketMessage } from './entities/contact-ticket-message.entity';
import { ContactMessage } from './entities/contact-message.entity';
import {
  ContactTicketsController,
  ContactMessagesLegacyController,
} from './contact-messages.controller';
import { ContactTicketsService } from './contact-tickets.service';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactTicket, ContactTicketMessage, ContactMessage, User])],
  controllers: [ContactTicketsController, ContactMessagesLegacyController],
  providers: [ContactTicketsService],
  exports: [ContactTicketsService],
})
export class ContactMessagesModule {}
