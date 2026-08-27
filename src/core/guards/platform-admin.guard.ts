import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('PLATFORM_ADMIN_KEY');
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
