import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

const wsAllowedOrigins = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());

@WebSocketGateway({
  cors: {
    origin: wsAllowedOrigins.length === 1 && wsAllowedOrigins[0] === '*' ? '*' : wsAllowedOrigins,
    credentials: true,
  },
})
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
