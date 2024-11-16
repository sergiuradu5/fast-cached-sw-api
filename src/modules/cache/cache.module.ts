import { CacheStore, CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheManagerService } from './cache-manager.service';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
            passphrase: 'your_strong_password'
          }
        })
        return {
          ttl: 3 * 60 * 1000, //3 minutes (milliseconds)
          max: 4000,
          store: store as unknown as CacheStore,
        }
      },
    }),
  ],
  providers: [CacheManagerService, HttpCacheInterceptor,],
  exports: [CacheManagerService, HttpCacheInterceptor],
})
export class CacheModule { }
