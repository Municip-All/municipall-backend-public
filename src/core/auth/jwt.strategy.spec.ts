import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('throws when JWT_SECRET is missing', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    expect(() => new JwtStrategy(config)).toThrow(InternalServerErrorException);
  });

  it('validate returns mapped payload fields', () => {
    const config = { get: jest.fn().mockReturnValue('test-secret') } as unknown as ConfigService;
    const strategy = new JwtStrategy(config);
    expect(
      strategy.validate({
        sub: 1,
        email: 'a@b.c',
        role: 'citizen',
        cityId: 'c1',
      }),
    ).toEqual({
      sub: 1,
      email: 'a@b.c',
      role: 'citizen',
      cityId: 'c1',
    });
  });
});
