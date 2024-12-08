import { CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Header, InternalServerErrorException, Param, Query, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { HttpCacheInterceptor } from 'src/modules/cache/interceptors/http-cache.interceptor';
import { GetItemByIdRequestParamDto } from 'src/modules/common/dto/get-item-by-id-request-param.dto';
import { GetFilmsRequestQueryDto } from '../dtos/get-films-request-query.dto';
import { FilmsService } from '../services/films.service';

@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) { }
  @Get()
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60 * 1000)
  async getFilms(
    @Query(new ValidationPipe()) query: GetFilmsRequestQueryDto,
  ) {
    return this.filmsService.getFilms({ search: query.search })
  }

  @Get(':id')
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60 * 1000)
  async getPersonById(
    @Param() { id }: GetItemByIdRequestParamDto,
  ) {
    return this.filmsService.getFilmById({ id });
  }
}

