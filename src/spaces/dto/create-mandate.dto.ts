import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsUUID,
  Matches,
} from 'class-validator';

const SCOPE_ITEM_PATTERN = /^[a-z0-9]+(\.[a-z0-9]+)+$/;

export class CreateMandateDto {
  @IsUUID()
  helperId: string;

  @IsArray()
  @ArrayMinSize(1)
  @Matches(SCOPE_ITEM_PATTERN, {each: true})
  scope: string[];

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;
}
