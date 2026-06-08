import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { hasAnyPermission, Permission } from '../auth/permissions';

interface AuthUser {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Deny by default : toute route authentifiée doit déclarer @RequirePermissions
    if (!required?.length) {
      throw new ForbiddenException('Accès refusé. Permission non configurée pour cette route.');
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user?.role) {
      throw new ForbiddenException('Accès refusé.');
    }

    if (hasAnyPermission(user.role, required)) {
      return true;
    }

    throw new ForbiddenException("Vous n'avez pas les droits pour effectuer cette action.");
  }
}
