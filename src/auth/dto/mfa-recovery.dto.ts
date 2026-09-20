import {IsNotEmpty, IsString, Matches} from 'class-validator';

export class MfaRecoveryDto {
  @IsString()
  @IsNotEmpty()
  mfaToken: string;

  @Matches(/^[0-9a-f]{4}(-?[0-9a-f]{4}){3}$/i, {
    message: 'recoveryCode must look like xxxx-xxxx-xxxx-xxxx',
  })
  recoveryCode: string;
}
