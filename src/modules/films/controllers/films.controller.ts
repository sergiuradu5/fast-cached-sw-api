import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Header, Query, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { GetFilmsRequestQueryDto } from '../dtos/get-films-request-query.dto';
import { FilmsService } from '../services/films.service';

@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) { }
  @Get()
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 1000)
  async getFilms(
    @Query(new ValidationPipe()) query: GetFilmsRequestQueryDto,
  ) {
    return this.filmsService.getFilms({ search: query.search })
  }
}
