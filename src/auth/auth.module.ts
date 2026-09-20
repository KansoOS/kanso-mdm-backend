import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {SecretCipherService} from './secret-cipher.service';
import {TotpController} from './totp.controller';
import {TotpService} from './totp.service';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const JWT_SECRET_MIN_LENGTH = 32;

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < JWT_SECRET_MIN_LENGTH) {
          throw new Error(
            `JWT_SECRET must be set (at least ${JWT_SECRET_MIN_LENGTH} characters).`,
          );
        }
        return {secret, signOptions: {expiresIn: ACCESS_TOKEN_TTL_SECONDS}};
      },
    }),
  ],
  controllers: [AuthController, TotpController],
  providers: [AuthService, TotpService, SecretCipherService],
})
export class AuthModule {}
