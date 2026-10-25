import {IsString, Length} from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @Length(1, 100)
  pseudonym: string;
}
