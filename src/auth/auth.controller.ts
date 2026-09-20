import {Body, Controller, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {AuthService} from './auth.service';
import {LoginDto} from './dto/login.dto';
import {MfaLoginDto} from './dto/mfa-login.dto';
import {MfaRecoveryDto} from './dto/mfa-recovery.dto';
import {SignupDto} from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('login/totp')
  @HttpCode(HttpStatus.OK)
  loginWithTotp(@Body() dto: MfaLoginDto) {
    return this.authService.loginWithTotp(dto);
  }

  @Post('login/recovery')
  @HttpCode(HttpStatus.OK)
  loginWithRecoveryCode(@Body() dto: MfaRecoveryDto) {
    return this.authService.loginWithRecoveryCode(dto);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }
}
