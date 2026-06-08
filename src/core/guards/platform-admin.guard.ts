import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Protège les routes /admin (webadmin Municipall).
 * Clé serveur via PLATFORM_ADMIN_KEY — jamais exposée au backoffice mairie.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.PLATFORM_ADMIN_KEY;
    if (!expected) {
      throw new ForbiddenException(
        'Accès plateforme non configuré (PLATFORM_ADMIN_KEY manquante).',
      );
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const key = request.headers['x-platform-admin-key'];
    const provided = typeof key === 'string' ? key : '';

    if (!provided || provided !== expected) {
      throw new ForbiddenException('Accès plateforme refusé.');
    }

    return true;
  }
}
