import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe-to-city')
  handleSubscribeToCity(@MessageBody() _cityId: string) {
    // Logic to join a room for real-time city updates
  }

  sendStatusUpdate(cityId: string, data: any) {
    this.server.to(cityId).emit('status-update', data);
  }
}
