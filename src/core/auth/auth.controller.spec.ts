import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

jest.mock(
  'bcrypt',
  () => ({
    hash: jest.fn(),
    compare: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '@nestjs/throttler',
  () => ({
    Throttle: () => () => undefined,
    SkipThrottle: () => () => undefined,
  }),
  { virtual: true },
);

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    signup: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    controller = module.get(AuthController);
  });

  it('signup delegates', async () => {
    authService.signup.mockResolvedValue({ access_token: 't' });
    await expect(controller.signup({ email: 'a' } as never)).resolves.toEqual({
      access_token: 't',
    });
  });

  it('login throws on bad credentials', async () => {
    authService.validateUser.mockResolvedValue(null);
    await expect(
      controller.login({ email: 'a', password: 'b' } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login and backofficeLogin succeed', async () => {
    const user = { id: 1, role: 'mayor' };
    authService.validateUser.mockResolvedValue(user);
    authService.login.mockResolvedValue({ access_token: 't' });
    await expect(controller.login({ email: 'a', password: 'b' } as never)).resolves.toEqual({
      access_token: 't',
    });
    await controller.backofficeLogin({ email: 'a', password: 'b' } as never);
    expect(authService.login).toHaveBeenCalledWith(user, { backofficeOnly: true });
  });

  it('getProfile strips password', async () => {
    authService.getMe.mockResolvedValue({
      id: 1,
      email: 'a@b.c',
      role: 'citizen',
      password: 'secret',
      name: 'A',
    });
    const result = await controller.getProfile({
      user: { sub: 1, email: 'a@b.c', role: 'citizen' },
    } as never);
    expect(result).not.toHaveProperty('password');
    expect(result.permissions).toEqual(expect.any(Array));
  });

  it('getProfile throws when missing', async () => {
    authService.getMe.mockResolvedValue(null);
    await expect(
      controller.getProfile({ user: { sub: 1, email: 'a', role: 'citizen' } } as never),
    ).rejects.toThrow(UnauthorizedException);
  });
});
