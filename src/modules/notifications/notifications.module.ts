import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
import { ExpoPushService } from './expo-push.service';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, ExpoPushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
