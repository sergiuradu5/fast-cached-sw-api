import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { CacheModule } from './modules/cache/cache.module';
import { HttpModule } from './modules/http/http.module';
import { LoggerModule } from './modules/logger/logger.module';
import { PeopleModule } from './modules/people/people.module';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ClsModule.forRoot({
      middleware: {
        // automatically mount the
        // ClsMiddleware for all routes
        mount: true,
        // and use the setup method to
        // provide default store values.
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
    CacheModule, LoggerModule, HttpModule, PeopleModule, HttpModule],
  controllers: [],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }
