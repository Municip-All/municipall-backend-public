import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
import { ExpoPushService } from './expo-push.service';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, ExpoPushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
