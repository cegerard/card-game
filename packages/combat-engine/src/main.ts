import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loggerMiddleware } from './logger-middleware';

async function bootstrap() {
  const port = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule);

  app.use(loggerMiddleware);
  app.enableCors();

  await app.listen(port);
}

bootstrap();
