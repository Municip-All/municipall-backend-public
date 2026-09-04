import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { ExpoPushService } from './expo-push.service';
import { User } from '../user/user.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const userRepository = {
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
    findOne: jest.fn(),
  };
  const expoPush = { sendBatch: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: ExpoPushService, useValue: expoPush },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('registerPushToken updates user', async () => {
    userRepository.update.mockResolvedValue(undefined);
    await expect(service.registerPushToken(1, 'tok')).resolves.toEqual({ ok: true });
  });

  it('sendTargetedAlert sends to recipients', async () => {
    qb.getMany.mockResolvedValue([
      { id: 1, expoPushToken: 'ExponentPushToken[abc]' },
    ]);
    expoPush.sendBatch.mockResolvedValue({ sent: 1, failed: 0 });
    const result = await service.sendTargetedAlert('c1', {
      title: 'Alerte',
      message: 'msg',
      type: 'urgent',
      zones: ['Centre'],
    } as never);
    expect(result.recipientCount).toBe(1);
    expect(result.sent).toBe(1);
  });

  it('sendTargetedAlert falls back when zone filter empty', async () => {
    qb.getMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 2, expoPushToken: 'ExponentPushToken[x]' }]);
    expoPush.sendBatch.mockResolvedValue({ sent: 1, failed: 0 });
    const result = await service.sendTargetedAlert('c1', {
      title: 'A',
      message: 'm',
      type: 'info',
      zones: ['Inconnue'],
    } as never);
    expect(result.recipientCount).toBe(1);
  });

  it('sendPushNotification skips without token', async () => {
    userRepository.findOne.mockResolvedValue({ id: 1 });
    await expect(service.sendPushNotification('1', 't', 'b')).resolves.toEqual({
      sent: 0,
      failed: 0,
    });
  });

  it('sendPushNotification sends when token present', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 1,
      expoPushToken: 'ExponentPushToken[x]',
    });
    expoPush.sendBatch.mockResolvedValue({ sent: 1, failed: 0 });
    await expect(service.sendPushNotification('1', 't', 'b', { k: 1 })).resolves.toEqual({
      sent: 1,
      failed: 0,
    });
  });
});
