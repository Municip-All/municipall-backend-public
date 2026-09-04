import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { TenantGuard } from './tenant.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { ConfigService } from '@nestjs/config';
import { Permission } from '../auth/permissions';

function mockContext(overrides: {
  isPublic?: boolean;
  skipTenant?: boolean;
  permissions?: Permission[];
  user?: Record<string, unknown>;
  tenantId?: string;
  headers?: Record<string, string>;
}): ExecutionContext {
  const reflectorValues: Record<string, unknown> = {};
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: overrides.user,
        tenantId: overrides.tenantId,
        headers: overrides.headers ?? {},
      }),
    }),
    _reflector: reflectorValues,
  } as unknown as ExecutionContext;
}

describe('Guards', () => {
  describe('JwtAuthGuard', () => {
    it('allows public routes', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      } as unknown as Reflector;
      const guard = new JwtAuthGuard(reflector);
      expect(guard.canActivate(mockContext({}))).toBe(true);
    });

    it('handleRequest returns user or throws', () => {
      const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn() } as unknown as Reflector);
      expect(guard.handleRequest(null, { sub: 1 })).toEqual({ sub: 1 });
      expect(() => guard.handleRequest(null, null as never)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(new Error('x'), null as never)).toThrow('x');
    });
  });

  describe('PermissionsGuard', () => {
    const make = (values: unknown[]) => {
      const reflector = {
        getAllAndOverride: jest.fn().mockImplementation(() => values.shift()),
      } as unknown as Reflector;
      return new PermissionsGuard(reflector);
    };

    it('allows public', () => {
      expect(make([true]).canActivate(mockContext({}))).toBe(true);
    });

    it('denies without required permissions metadata', () => {
      expect(() => make([false, undefined]).canActivate(mockContext({}))).toThrow(
        ForbiddenException,
      );
    });

    it('checks role permissions', () => {
      const ctx = mockContext({ user: { role: 'mayor' } });
      expect(make([false, [Permission.REPORTS_READ]]).canActivate(ctx)).toBe(true);
      expect(() =>
        make([false, [Permission.PLATFORM_ADMIN]]).canActivate(
          mockContext({ user: { role: 'citizen' } }),
        ),
      ).toThrow(ForbiddenException);
      expect(() => make([false, [Permission.REPORTS_READ]]).canActivate(mockContext({}))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('TenantGuard', () => {
    const make = (values: unknown[]) =>
      new TenantGuard({
        getAllAndOverride: jest.fn().mockImplementation(() => values.shift()),
      } as unknown as Reflector);

    it('skips public / skipTenant / citizen / platform admin', () => {
      expect(make([true]).canActivate(mockContext({}))).toBe(true);
      expect(make([false, true]).canActivate(mockContext({}))).toBe(true);
      expect(make([false, false]).canActivate(mockContext({ user: { role: 'citizen' } }))).toBe(
        true,
      );
      expect(
        make([false, false]).canActivate(mockContext({ user: { role: 'platform_admin' } })),
      ).toBe(true);
    });

    it('enforces tenant match for staff', () => {
      expect(
        make([false, false]).canActivate(
          mockContext({
            user: { role: 'mayor', cityId: 'c1' },
            tenantId: 'c1',
          }),
        ),
      ).toBe(true);
      expect(() =>
        make([false, false]).canActivate(
          mockContext({
            user: { role: 'mayor', cityId: 'c1' },
            tenantId: 'c2',
          }),
        ),
      ).toThrow(ForbiddenException);
      expect(() =>
        make([false, false]).canActivate(mockContext({ user: { role: 'mayor' }, tenantId: 'c1' })),
      ).toThrow(ForbiddenException);
    });
  });

  describe('PlatformAdminGuard', () => {
    it('validates platform key', () => {
      const config = { get: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;
      const guard = new PlatformAdminGuard(config);
      expect(
        guard.canActivate(mockContext({ headers: { 'x-platform-admin-key': 'secret' } })),
      ).toBe(true);
      expect(() =>
        guard.canActivate(mockContext({ headers: { 'x-platform-admin-key': 'bad' } })),
      ).toThrow(ForbiddenException);

      const missing = new PlatformAdminGuard({
        get: jest.fn().mockReturnValue(''),
      } as unknown as ConfigService);
      expect(() => missing.canActivate(mockContext({}))).toThrow(ForbiddenException);
    });
  });
});
