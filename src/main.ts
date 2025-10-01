import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
// Handle the bootstrap promise explicitly to avoid unhandled rejections
bootstrap().catch((err) => {
  console.error('Error during NestJS bootstrap', err); // no-console: acceptable on startup failure
  process.exit(1);
});
