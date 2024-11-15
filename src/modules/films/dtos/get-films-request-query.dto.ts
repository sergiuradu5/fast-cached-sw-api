import { IsOptional, IsString, MaxLength } from "class-validator";
import { REQUEST_DTO_MAX_LENGTH } from "src/modules/common/constants/request-dto.constants";

export class GetFilmsRequestQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(REQUEST_DTO_MAX_LENGTH)
  search?: string;
}
