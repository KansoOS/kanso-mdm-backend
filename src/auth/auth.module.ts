import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const JWT_SECRET_MIN_LENGTH = 32;

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < JWT_SECRET_MIN_LENGTH) {
          throw new Error(
            `JWT_SECRET must be set (at least ${JWT_SECRET_MIN_LENGTH} characters).`
          );
        }
        return {secret, signOptions: {expiresIn: ACCESS_TOKEN_TTL_SECONDS}};
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
