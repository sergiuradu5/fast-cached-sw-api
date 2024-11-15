import { Module } from "@nestjs/common";
import { StarshipsController } from "./controllers/starships.controller";
import { StarshipsService } from "./services/starships.service";

@Module({
  imports: [],
  controllers: [StarshipsController],
  providers: [StarshipsService],
})
export class StarshipsModule { }