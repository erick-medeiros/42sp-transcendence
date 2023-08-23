// https://docs.nestjs.com/techniques/validation#auto-validation

import * as session from 'express-session';
import * as passport from 'passport';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeormStore } from 'connect-typeorm';
import { AppModule } from './app.module';
import { AxiosExceptionFilter } from './filters/axios-exception-filter';
import { Session } from './core/entities';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const sessionRepository = app.get(DataSource).getRepository(Session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore().connect(sessionRepository),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AxiosExceptionFilter());

  await app.listen(3001);
}
bootstrap();
