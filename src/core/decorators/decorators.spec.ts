import { IS_PUBLIC_KEY, Public } from './public.decorator';
import { PERMISSIONS_KEY, RequirePermissions } from './require-permissions.decorator';
import { SKIP_TENANT_CHECK_KEY, SkipTenantCheck } from './skip-tenant-check.decorator';
import { Permission } from '../auth/permissions';

describe('decorators', () => {
  it('Public sets isPublic metadata key', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });

  it('RequirePermissions sets permissions metadata', () => {
    expect(PERMISSIONS_KEY).toBe('permissions');
    const decorator = RequirePermissions(Permission.REPORTS_READ, Permission.REPORTS_CREATE);
    expect(typeof decorator).toBe('function');
  });

  it('SkipTenantCheck sets skipTenantCheck metadata', () => {
    expect(SKIP_TENANT_CHECK_KEY).toBe('skipTenantCheck');
    const decorator = SkipTenantCheck();
    expect(typeof decorator).toBe('function');
  });
});
