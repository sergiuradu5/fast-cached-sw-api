import { Global, Module } from '@nestjs/common';
import { CachedHttpService } from './cached-http.service';
@Global()
@Module({
  imports: [],
  providers: [CachedHttpService],
  exports: [CachedHttpService],
})
export class HttpModule {}
