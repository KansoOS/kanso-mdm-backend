import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import {AppModule} from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // Le dashboard tourne sur une autre origine (Vite) et envoie le cookie de
  // session via credentials: "include" : il faut une liste explicite
  // d'origines (pas de wildcard possible avec credentials) + credentials: true.
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map(origin =>
      origin.trim(),
    ) ?? [
      'http://localhost:5173', // dashboard via `npm run dev`
      'http://localhost:8081', // dashboard via `docker compose up` (WEB_PORT)
    ],
    credentials: true,
  });
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
