import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

jest.mock(
  'bcrypt',
  () => ({
    hash: jest.fn(),
    compare: jest.fn(),
  }),
  { virtual: true },
);

describe('UserController', () => {
  let controller: UserController;
  const userService = {
    updateAvatar: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn(),
    getStats: jest.fn(),
    getNotificationPreferences: jest.fn(),
    updateNotificationPreferences: jest.fn(),
    updatePushToken: jest.fn(),
  };
  const req = { user: { sub: 7, email: 'a@b.c', role: 'citizen' } };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();
    controller = module.get(UserController);
  });

  it('updateAvatar requires url', async () => {
    await expect(controller.updateAvatar(req as never, {} as never)).rejects.toThrow(
      BadRequestException,
    );
    userService.updateAvatar.mockResolvedValue({});
    await controller.updateAvatar(req as never, { avatarUrl: 'u' } as never);
    expect(userService.updateAvatar).toHaveBeenCalledWith(7, 'u');
  });

  it('delegates other endpoints', async () => {
    userService.updateProfile.mockResolvedValue({});
    userService.updatePassword.mockResolvedValue({});
    userService.getStats.mockResolvedValue({ reports: 0 });
    userService.getNotificationPreferences.mockResolvedValue({});
    userService.updateNotificationPreferences.mockResolvedValue({});
    userService.updatePushToken.mockResolvedValue({});

    await controller.updateProfile(req as never, { name: 'n' } as never);
    await controller.updatePassword(req as never, { current: 'a', new: 'b', confirm: 'b' } as never);
    await controller.getStats(req as never);
    await controller.getPreferences(req as never);
    await controller.updatePreferences(req as never, {} as never);
    await controller.registerPushToken(req as never, { expoPushToken: 't' } as never);

    expect(userService.updateProfile).toHaveBeenCalled();
    expect(userService.updatePushToken).toHaveBeenCalledWith(7, 't');
  });
});
