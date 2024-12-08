import { IsNumberString, IsString } from "class-validator";

export class GetItemByIdRequestParamDto {
  @IsString()
  @IsNumberString()
  id: string;
}