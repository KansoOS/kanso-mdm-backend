import {IsNotEmpty, IsString, Matches} from 'class-validator';

export class MfaLoginDto {
  @IsString()
  @IsNotEmpty()
  mfaToken: string;

  @Matches(/^\d{6}$/, {message: 'code must be a 6-digit number'})
  code: string;
}
