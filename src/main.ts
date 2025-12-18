import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // ortiqcha fieldlarni olib tashlaymiz
      forbidNonWhitelisted: true,
      transform: true,          // query string → number o'tkazish
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
