import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { CacheModule } from './modules/cache/cache.module';
import { FilmsModule } from './modules/films/films.module';
import { HttpModule } from './modules/http/http.module';
import { LoggerModule } from './modules/logger/logger.module';
import { PeopleModule } from './modules/people/people.module';
import { StarshipsModule } from './modules/starships/starships.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClsModule.forRoot({
      middleware: {
        mount: true,
        setup: (cls, req) => {
        },
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public/',
      serveStaticOptions: {
        index: false
      }
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
      ignoreUserAgents: [/bot|crawler|spider|crawl/i],
      skipIf: (ctx) => {
        const req = ctx.switchToHttp().getRequest();
        return req.hostname === 'localhost';
      }
    }]),
    CacheModule, LoggerModule, HttpModule, forwardRef(() => PeopleModule), HttpModule, FilmsModule, StarshipsModule],
  controllers: [],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }
