import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AddressInfo } from 'net';
import { AppModule } from './app.module';
import { SET_APP_URL } from './setup/global-constants';
import { convertToLocalhost, initLogsFile, } from './setup/setup';
import tracer from './tracer';
import { ValidationPipe } from '@nestjs/common';

declare const module: any;

async function bootstrap() {
  await tracer.start();
  initLogsFile();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, });
  app.enableCors();
  const logger = app.get(Logger)
  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT ?? 3000, async () => {
    const addressInfo = await app.getHttpServer().address() as AddressInfo;
    const url = `http://${convertToLocalhost(addressInfo.address)}:${addressInfo.port}`;
    SET_APP_URL(url);
    logger.log(`Server is listening at ${url}`);
  });

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
