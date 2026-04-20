import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    // Extract tenant ID from headers or subdomain
    const tenantId = headers['x-tenant-id'];
    
    // Bind tenant context for geographical or administrative filtering
    request.tenantId = tenantId;

    return next.handle();
  }
}
