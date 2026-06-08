import { SetMetadata } from '@nestjs/common';
import { Permission } from '../auth/permissions';

export const PERMISSIONS_KEY = 'permissions';

/** Autorise l'accès si l'utilisateur possède au moins une de ces permissions. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
