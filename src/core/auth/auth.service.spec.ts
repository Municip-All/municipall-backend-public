import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../../modules/user/user.service';
import { UserRepository } from '../../modules/user/user.repository';
import { User } from '../../modules/user/user.entity';

const bcryptCompare = jest.fn();
const bcryptHash = jest.fn();

jest.mock(
  'bcrypt',
  () => ({
    compare: (...args: unknown[]) => bcryptCompare(...args) as Promise<boolean>,
    hash: (...args: unknown[]) => bcryptHash(...args) as Promise<string>,
  }),
  { virtual: true },
);

describe('AuthService', () => {
  let service: AuthService;
  let findByEmailMock: jest.Mock;
  let findByIdMock: jest.Mock;
  let createUserMock: jest.Mock;
  let signAsyncMock: jest.Mock;

  const mockUser: Pick<
    User,
    'id' | 'email' | 'name' | 'surname' | 'role' | 'cityId' | 'avatar_url' | 'password'
  > = {
    id: 1,
    email: 'test@example.com',
    name: 'John',
    surname: 'Doe',
    role: 'citizen',
    cityId: 'city-1',
    avatar_url: undefined,
    password: 'hashed_password',
  };

  beforeEach(async () => {
    findByEmailMock = jest.fn();
    findByIdMock = jest.fn();
    createUserMock = jest.fn();
    signAsyncMock = jest.fn().mockResolvedValue('jwt-token');
    bcryptCompare.mockReset();
    bcryptHash.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: findByEmailMock,
            findById: findByIdMock,
          },
        },
        {
          provide: UserRepository,
          useValue: {
            createUser: createUserMock,
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: signAsyncMock,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      findByEmailMock.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');
      expect(result).toEqual(mockUser);
      expect(findByEmailMock).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user is not found', async () => {
      findByEmailMock.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password123');
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      findByEmailMock.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token and user info', async () => {
      const result = await service.login(mockUser as User);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'John',
          surname: 'Doe',
          role: 'citizen',
          avatar_url: undefined,
          cityId: 'city-1',
          permissions: expect.any(Array) as unknown as string[],
        },
      });
      expect(signAsyncMock).toHaveBeenCalledWith({
        sub: 1,
        email: 'test@example.com',
        role: 'citizen',
        cityId: 'city-1',
      });
    });

    it('should throw ForbiddenException when backofficeOnly and user is citizen', async () => {
      await expect(service.login(mockUser as User, { backofficeOnly: true })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow login for backoffice user when backofficeOnly', async () => {
      const mayorUser = { ...mockUser, role: 'mayor' };
      const result = await service.login(mayorUser as User, { backofficeOnly: true });
      expect(result.access_token).toBe('jwt-token');
    });
  });

  describe('signup', () => {
    it('should create user and return login result', async () => {
      const signupDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const createdUser = { ...mockUser, ...signupDto, role: 'Citoyen' };

      bcryptHash.mockResolvedValue('hashed_new_password');
      createUserMock.mockResolvedValue(createdUser);

      const result = await service.signup(signupDto);
      expect(createUserMock).toHaveBeenCalledWith({
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'hashed_new_password',
        role: 'Citoyen',
        cityId: undefined,
      });
      expect(result.access_token).toBe('jwt-token');
    });
  });

  describe('getMe', () => {
    it('should return user by id', async () => {
      findByIdMock.mockResolvedValue(mockUser);
      await expect(service.getMe(1)).resolves.toEqual(mockUser);
      expect(findByIdMock).toHaveBeenCalledWith(1);
    });
  });
});
