import { TenantInterceptor } from './tenant.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TenantInterceptor', () => {
  it('binds x-tenant-id onto request', () => {
    const request: { headers: Record<string, string>; tenantId?: string } = {
      headers: { 'x-tenant-id': 'city-9' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of('ok') } as CallHandler;
    const interceptor = new TenantInterceptor();
    interceptor.intercept(context, next).subscribe();
    expect(request.tenantId).toBe('city-9');
  });
});
