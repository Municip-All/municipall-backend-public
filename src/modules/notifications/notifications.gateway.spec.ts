import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  const configGet = jest.fn();
  const verifyAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new NotificationsGateway(
      { get: configGet } as unknown as ConfigService,
      { verifyAsync } as unknown as JwtService,
    );
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as never;
  });

  it('afterInit logs without throwing', () => {
    expect(() => gateway.afterInit()).not.toThrow();
  });

  describe('handleConnection', () => {
    it('disconnects when no token', async () => {
      const client = {
        id: 's1',
        handshake: { auth: {}, headers: {} },
        disconnect: jest.fn(),
      };
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('accepts valid Bearer token', async () => {
      configGet.mockReturnValue('secret');
      verifyAsync.mockResolvedValue({ sub: 1 });
      const client = {
        id: 's2',
        handshake: { auth: {}, headers: { authorization: 'Bearer tok' } },
        disconnect: jest.fn(),
      };
      await gateway.handleConnection(client as never);
      expect(verifyAsync).toHaveBeenCalledWith('tok', { secret: 'secret' });
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('disconnects on invalid token', async () => {
      configGet.mockReturnValue('secret');
      verifyAsync.mockRejectedValue(new Error('bad'));
      const client = {
        id: 's3',
        handshake: { auth: { token: 'bad' }, headers: {} },
        disconnect: jest.fn(),
      };
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });
  });

  it('handleSubscribeToCity joins room', () => {
    const client = { join: jest.fn() };
    gateway.handleSubscribeToCity('city-1', client as never);
    expect(client.join).toHaveBeenCalledWith('city-1');
  });

  it('sendStatusUpdate emits to city room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server.to = to;
    gateway.sendStatusUpdate('city-1', { status: 'ok' });
    expect(to).toHaveBeenCalledWith('city-1');
    expect(emit).toHaveBeenCalledWith('status-update', { status: 'ok' });
  });
});
