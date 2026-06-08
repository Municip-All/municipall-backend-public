import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_TENANT_CHECK_KEY } from '../decorators/skip-tenant-check.decorator';
import { CanonicalRole, normalizeToCanonicalRole } from '../auth/permissions';

interface AuthUser {
  sub: number;
  role: string;
  cityId?: string;
}

interface TenantRequest {
  user?: AuthUser;
  tenantId?: string;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipTenant) return true;

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    if (!user) return true;

    const canonical = normalizeToCanonicalRole(user.role);
    if (canonical === CanonicalRole.PLATFORM_ADMIN) return true;
    // Les citoyens (app mobile) utilisent la ville détectée par GPS, pas forcément user.cityId
    if (canonical === CanonicalRole.CITIZEN) return true;

    const headerTenant = request.headers['x-tenant-id'];
    const tenantId =
      request.tenantId ?? (typeof headerTenant === 'string' ? headerTenant : undefined);

    const userCityId = user.cityId;
    if (!userCityId || !tenantId) {
      throw new ForbiddenException('Contexte ville manquant pour cette opération.');
    }

    if (userCityId !== tenantId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé pour cette ville.");
    }

    return true;
  }
}
