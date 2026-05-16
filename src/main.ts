import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync } from 'fs';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  mkdirSync(join(process.cwd(), 'uploads', 'assignments'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'assignments', 'images'), {
    recursive: true,
  });
  mkdirSync(join(process.cwd(), 'uploads', 'activities'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'activities', 'images'), {
    recursive: true,
  });
  mkdirSync(join(process.cwd(), 'uploads', 'chapters'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'quizzes'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'lessons'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'profiles'), { recursive: true });
  mkdirSync(join(process.cwd(), 'uploads', 'materials'), { recursive: true });

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
