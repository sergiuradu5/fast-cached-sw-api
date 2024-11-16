import { CACHE_MANAGER, CACHE_TTL_METADATA, CacheInterceptor } from "@nestjs/cache-manager";
import { CallHandler, ExecutionContext, forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { isFunction, isNil } from "lodash";
import { Observable, of, tap } from "rxjs";
import { CacheManagerService } from "../cache-manager.service";

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  private logger = new Logger(HttpCacheInterceptor.name);
  constructor(
    @Inject(forwardRef(() => CACHE_MANAGER)) protected readonly cacheManager: any,
    protected readonly reflector: Reflector,
    private cacheManagerService: CacheManagerService,
  ) {
    super(cacheManager, reflector);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const key = this.trackBy(context);
    const ttlValueOrFactory =
      this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) || null;

    if (!key) {
      this.logger.warn('No cache key found');
      return next.handle();
    }
    try {
      const value = await this.cacheManagerService.get(key);
      if (!isNil(value)) {
        this.logger.verbose('Cache hit: ' + key);
        return of(value);
      }
      this.logger.verbose('Cache miss: ' + key);
      const ttl = isFunction(ttlValueOrFactory)
        ? await ttlValueOrFactory(context)
        : ttlValueOrFactory;
      return next.handle().pipe(
        tap(response => {
          const args = isNil(ttl) ? [key, response] : [key, response, { ttl }];
          this.logger.verbose(`Setting cache: ${key}`);
          this.cacheManagerService.set(key, response, ttl as number ?? undefined);
        }),
      );
    } catch {
      return next.handle();
    }
  }

}
