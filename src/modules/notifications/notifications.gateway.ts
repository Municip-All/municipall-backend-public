import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

const wsAllowedOrigins = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());

@WebSocketGateway({
  cors: {
    origin: wsAllowedOrigins.length === 1 && wsAllowedOrigins[0] === '*' ? '*' : wsAllowedOrigins,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit() {
    this.logger.log('NotificationsGateway initialized');
  }

  async handleConnection(client: Socket) {
    const rawAuth: string | undefined =
      (client.handshake.auth?.token as string | undefined) ??
      client.handshake.headers?.authorization;

    const token = rawAuth?.startsWith('Bearer ') ? rawAuth.slice(7) : rawAuth;

    if (!token) {
      this.logger.warn(`WebSocket client ${client.id} disconnected: no token provided`);
      client.disconnect(true);
      return;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      await this.jwtService.verifyAsync(token, { secret });
    } catch {
      this.logger.warn(`WebSocket client ${client.id} disconnected: invalid token`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('subscribe-to-city')
  handleSubscribeToCity(@MessageBody() cityId: string, @ConnectedSocket() client: Socket) {
    void client.join(cityId);
  }

  sendStatusUpdate(cityId: string, data: unknown) {
    this.server.to(cityId).emit('status-update', data);
  }
}
