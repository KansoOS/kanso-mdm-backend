import {Matches} from 'class-validator';

export class TotpCodeDto {
  @Matches(/^\d{6}$/, {message: 'code must be a 6-digit number'})
  code: string;
}
