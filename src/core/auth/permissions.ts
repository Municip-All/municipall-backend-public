/** Permissions granulaires — deny by default si absentes du rôle. */
export enum Permission {
  REPORTS_READ = 'reports:read',
  REPORTS_CREATE = 'reports:create',
  REPORTS_REPLY = 'reports:reply',
  REPORTS_STATUS = 'reports:status',

  CONTACT_READ = 'contact:read',
  CONTACT_CREATE = 'contact:create',
  CONTACT_REPLY = 'contact:reply',
  CONTACT_CLOSE = 'contact:close',

  CITY_CONFIG_READ = 'city_config:read',
  CITY_CONFIG_WRITE = 'city_config:write',

  NOTIFICATIONS_SEND = 'notifications:send',

  EVENTS_MANAGE = 'events:manage',
  CONSTRUCTION_MANAGE = 'construction:manage',

  WIDGETS_READ = 'widgets:read',
  NEIGHBORHOODS_MANAGE = 'neighborhoods:manage',

  TEAM_READ = 'team:read',
  TEAM_MANAGE = 'team:manage',
  TEAM_KPIS = 'team:kpis',

  PROFILE_READ = 'profile:read',
  PROFILE_WRITE = 'profile:write',

  PLATFORM_ADMIN = 'platform:admin',
}

export enum CanonicalRole {
  PLATFORM_ADMIN = 'platform_admin',
  MAYOR = 'mayor',
  ASSISTANT = 'assistant',
  AGENT = 'agent',
  CITIZEN = 'citizen',
}

const ALL_PERMISSIONS = Object.values(Permission);

const MAYOR_PERMISSIONS: Permission[] = [
  Permission.REPORTS_READ,
  Permission.REPORTS_REPLY,
  Permission.REPORTS_STATUS,
  Permission.CONTACT_READ,
  Permission.CONTACT_REPLY,
  Permission.CONTACT_CLOSE,
  Permission.CITY_CONFIG_READ,
  Permission.CITY_CONFIG_WRITE,
  Permission.NOTIFICATIONS_SEND,
  Permission.EVENTS_MANAGE,
  Permission.CONSTRUCTION_MANAGE,
  Permission.WIDGETS_READ,
  Permission.NEIGHBORHOODS_MANAGE,
  Permission.TEAM_READ,
  Permission.TEAM_MANAGE,
  Permission.TEAM_KPIS,
  Permission.PROFILE_READ,
  Permission.PROFILE_WRITE,
];

const ASSISTANT_PERMISSIONS: Permission[] = [
  Permission.REPORTS_READ,
  Permission.REPORTS_REPLY,
  Permission.REPORTS_STATUS,
  Permission.CONTACT_READ,
  Permission.CONTACT_REPLY,
  Permission.CITY_CONFIG_READ,
  Permission.EVENTS_MANAGE,
  Permission.CONSTRUCTION_MANAGE,
  Permission.WIDGETS_READ,
  Permission.TEAM_READ,
  Permission.PROFILE_READ,
  Permission.PROFILE_WRITE,
];

const CITIZEN_PERMISSIONS: Permission[] = [
  Permission.REPORTS_CREATE,
  Permission.REPORTS_READ,
  Permission.REPORTS_REPLY,
  Permission.CONTACT_CREATE,
  Permission.CONTACT_READ,
  Permission.CONTACT_REPLY,
  Permission.CITY_CONFIG_READ,
  Permission.WIDGETS_READ,
  Permission.PROFILE_READ,
  Permission.PROFILE_WRITE,
];

const ROLE_PERMISSIONS: Record<CanonicalRole, Permission[]> = {
  [CanonicalRole.PLATFORM_ADMIN]: ALL_PERMISSIONS,
  [CanonicalRole.MAYOR]: MAYOR_PERMISSIONS,
  [CanonicalRole.ASSISTANT]: ASSISTANT_PERMISSIONS,
  [CanonicalRole.AGENT]: ASSISTANT_PERMISSIONS,
  [CanonicalRole.CITIZEN]: CITIZEN_PERMISSIONS,
};

/** Mappe les rôles historiques (varchar libre) vers un rôle canonique. */
export function normalizeToCanonicalRole(role: string | undefined | null): CanonicalRole {
  const n = (role ?? '').trim().toLowerCase();

  if (!n) return CanonicalRole.CITIZEN;

  if (
    n === 'platform_admin' ||
    n === 'admin' ||
    n === 'administrateur' ||
    n === 'moderator' ||
    n === 'staff'
  ) {
    return CanonicalRole.PLATFORM_ADMIN;
  }

  if (n === 'mayor' || n === 'maire' || n === 'mairie') {
    return CanonicalRole.MAYOR;
  }

  if (n === 'assistant' || n === 'conseiller' || n === 'adjoint') {
    return CanonicalRole.ASSISTANT;
  }

  if (n === 'agent' || n.startsWith('agent')) {
    return CanonicalRole.AGENT;
  }

  if (n === 'citizen' || n === 'citoyen') {
    return CanonicalRole.CITIZEN;
  }

  return CanonicalRole.CITIZEN;
}

export function getPermissionsForRole(role: string | undefined | null): Permission[] {
  const canonical = normalizeToCanonicalRole(role);
  return ROLE_PERMISSIONS[canonical] ?? [];
}

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(
  role: string | undefined | null,
  permissions: Permission[],
): boolean {
  const granted = new Set(getPermissionsForRole(role));
  return permissions.some((p) => granted.has(p));
}

export function isBackofficeRole(role: string | undefined | null): boolean {
  const canonical = normalizeToCanonicalRole(role);
  return (
    canonical === CanonicalRole.MAYOR ||
    canonical === CanonicalRole.ASSISTANT ||
    canonical === CanonicalRole.AGENT
  );
}

export function canManageTeam(role: string | undefined | null): boolean {
  return hasPermission(role, Permission.TEAM_MANAGE);
}

export function canViewTeamKpis(role: string | undefined | null): boolean {
  return hasPermission(role, Permission.TEAM_KPIS);
}
