import {IsString, Length} from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @Length(1, 100)
  pseudonym: string;
}
