import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe, InternalServerErrorException } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const jsonBodyLimit = process.env.JSON_BODY_LIMIT ?? '15mb';
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: jsonBodyLimit });
  app.useBodyParser('urlencoded', { limit: jsonBodyLimit, extended: true });

  const corsOriginsEnv = process.env.CORS_ORIGINS;
  if (process.env.NODE_ENV === 'production' && !corsOriginsEnv) {
    throw new InternalServerErrorException('CORS_ORIGINS env variable is required in production');
  }
  const allowedOrigins = (corsOriginsEnv || 'http://localhost:3000,http://localhost:3002').split(',').map((s) => s.trim());
  app.enableCors({
    origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? '*' : allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-tenant-id, x-platform-admin-key',
    credentials: true,
  });

  // Global prefixes and pipes
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle("Municip'All API")
      .setDescription('Robust backend for civic-tech platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port}/api/v1`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Swagger documentation: http://${host}:${port}/docs`);
  }
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Error during NestJS bootstrap', err);
  process.exit(1);
});
