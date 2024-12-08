import { CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Header, Param, Query, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { HttpCacheInterceptor } from 'src/modules/cache/interceptors/http-cache.interceptor';
import { GetItemByIdRequestParamDto } from 'src/modules/common/dto/get-item-by-id-request-param.dto';
import { GetStarshipsRequestQueryDto } from '../dtos/get-starships-request-query.dto';
import { StarshipsService } from '../services/starships.service';

@Controller('starships')
export class StarshipsController {
  constructor(private readonly starshipsService: StarshipsService) { }

  @Get()
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60 * 1000)
  async getStarships(
    @Query(new ValidationPipe()) query: GetStarshipsRequestQueryDto,
  ) {
    return this.starshipsService.getStarships({ search: query.search });
  }


  @Get(':id')
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60 * 1000)
  async getPersonById(
    @Param() { id }: GetItemByIdRequestParamDto,
  ) {
    return this.starshipsService.getStarshipById({ id });
  }
}