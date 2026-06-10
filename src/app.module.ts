import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { TenantInterceptor } from './core/interceptors/tenant.interceptor';
import { CityConfigModule } from './modules/city-config/city-config.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { WidgetsModule } from './modules/widgets/widgets.module';
import { WeatherModule } from './modules/weather/weather.module';
import { AdminModule } from './modules/admin/admin.module';
import { ConstructionWorksModule } from './modules/construction-works/construction-works.module';
import { EventsModule } from './modules/events/events.module';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';
import { TransportModule } from './modules/transport/transport.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './modules/audit/audit.module';
import { StaffModule } from './modules/staff/staff.module';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { PermissionsGuard } from './core/guards/permissions.guard';
import { TenantGuard } from './core/guards/tenant.guard';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    StaffModule,
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'municipall',
      autoLoadEntities: true,
      // Dev : sync auto. Prod : DatabaseSchemaService (tables/colonnes manquantes uniquement).
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    CityConfigModule,
    ReportsModule,
    AiEngineModule,
    NotificationsModule,
    IntegrationModule,
    WidgetsModule,
    WeatherModule,
    AdminModule,
    ConstructionWorksModule,
    EventsModule,
    ContactMessagesModule,
    TransportModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
