import { Module } from '@nestjs/common';
import { LoggerModule as NestPinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    NestPinoLoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        transport: {
          targets: [
            {
              target: 'pino-rotating-file-stream',
              options: {
                filename: 'app.log',
                path: './logs',
                size: '100M',
                maxSize: '1G',
                interval: '1d',
              },
            },
            {
              target: 'pino-pretty',
              options: {
                colorize: true,
                ignore: 'pid,hostname,req,res',
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                messageFormat:
                  '[{level}] \x1b[31m{req.id}\x1b[0m  \x1b[32m{req.method}\x1b[0m \x1b[36m{req.url}\x1b[0m \x1b[32m{res.statusCode}\x1b[0m - \x1b[94m{msg}\x1b[0m',
                messageKey: 'msg',
                errorLikeObjectKeys: ['err', 'error'],
                levelFirst: true,
                singleLine: true,
                errorProps: 'message,stack',
                customColors:
                  'err:red,info:green,warn:yellow,debug:blue,trace:gray',
              },
            },
          ],
        },
      },
    }),
  ],
})
export class LoggerModule {}
