import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

interface RequestWithTenant extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    // Extract tenant ID from headers or subdomain
    const tenantId = request.headers['x-tenant-id'] as string | undefined;

    // Bind tenant context for geographical or administrative filtering
    request.tenantId = tenantId;

    return next.handle();
  }
}
