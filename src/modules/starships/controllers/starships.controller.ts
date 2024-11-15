import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Header, Query, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { GetStarshipsRequestQueryDto } from '../dtos/get-starships-request-query.dto';
import { StarshipsService } from '../services/starships.service';

@Controller('starships')
export class StarshipsController {
  constructor(private readonly starshipsService: StarshipsService) { }

  @Get()
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 1000)
  async getStarships(
    @Query(new ValidationPipe()) query: GetStarshipsRequestQueryDto,
  ) {
    return this.starshipsService.getStarships({ search: query.search });
  }
}