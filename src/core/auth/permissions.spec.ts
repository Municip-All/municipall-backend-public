import {
  getPermissionsForRole,
  hasAnyPermission,
  isBackofficeRole,
  normalizeToCanonicalRole,
  CanonicalRole,
  Permission,
} from './permissions';

describe('permissions', () => {
  it('normalizes roles', () => {
    expect(normalizeToCanonicalRole('Maire')).toBe(CanonicalRole.MAYOR);
    expect(normalizeToCanonicalRole('citoyen')).toBe(CanonicalRole.CITIZEN);
    expect(normalizeToCanonicalRole('unknown')).toBe(CanonicalRole.CITIZEN);
  });

  it('returns permissions and checks access', () => {
    expect(getPermissionsForRole('mayor')).toContain(Permission.CITY_CONFIG_WRITE);
    expect(getPermissionsForRole('citizen')).toContain(Permission.REPORTS_CREATE);
    expect(hasAnyPermission('mayor', [Permission.REPORTS_READ])).toBe(true);
    expect(hasAnyPermission('citizen', [Permission.PLATFORM_ADMIN])).toBe(false);
    expect(isBackofficeRole('mayor')).toBe(true);
    expect(isBackofficeRole('citizen')).toBe(false);
  });
});
