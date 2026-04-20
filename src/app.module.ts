import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
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

@Module({
  imports: [
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
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    CityConfigModule,
    ReportsModule,
    AiEngineModule,
    NotificationsModule,
    IntegrationModule,
    WidgetsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
