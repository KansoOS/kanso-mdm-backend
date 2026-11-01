import {IsString, Length} from 'class-validator';

export class UpdateDeviceDto {
  @IsString()
  @Length(1, 100)
  pseudonym: string;
}
