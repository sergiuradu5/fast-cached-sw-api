import { Module } from '@nestjs/common';
import { FilmsController } from './controllers/films.controller';
import { FilmsService } from './services/films.service';

@Module({
  controllers: [FilmsController],
  providers: [FilmsService]
})
export class FilmsModule { }
