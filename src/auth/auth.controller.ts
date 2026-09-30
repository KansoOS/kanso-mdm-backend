import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {Response} from 'express';
import {AuthService} from './auth.service';
import {LoginDto} from './dto/login.dto';
import {MfaLoginDto} from './dto/mfa-login.dto';
import {MfaRecoveryDto} from './dto/mfa-recovery.dto';
import {SignupDto} from './dto/signup.dto';
import {SessionId} from './session-id.decorator';
import {SESSION_COOKIE_NAME, sessionCookieOptions} from './session-cookie';
import {SessionAuthGuard} from './session-auth.guard';
import {SessionService} from './session.service';

const ABSOLUTE_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type LoginResult =
  | {mfaRequired: true; mfaToken: string}
  | {accessToken: string; sessionToken: string};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({passthrough: true}) res: Response) {
    return this.respond(await this.authService.login(dto), res);
  }

  @Post('login/totp')
  @HttpCode(HttpStatus.OK)
  async loginWithTotp(
    @Body() dto: MfaLoginDto,
    @Res({passthrough: true}) res: Response,
  ) {
    return this.respond(await this.authService.loginWithTotp(dto), res);
  }

  @Post('login/recovery')
  @HttpCode(HttpStatus.OK)
  async loginWithRecoveryCode(
    @Body() dto: MfaRecoveryDto,
    @Res({passthrough: true}) res: Response,
  ) {
    return this.respond(await this.authService.loginWithRecoveryCode(dto), res);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionAuthGuard)
  async logout(
    @SessionId() sessionId: string,
    @Res({passthrough: true}) res: Response,
  ) {
    await this.sessionService.destroy(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
  }

  private respond(result: LoginResult, res: Response) {
    if ('mfaRequired' in result) {
      return result;
    }
    const {accessToken, sessionToken} = result;
    res.cookie(
      SESSION_COOKIE_NAME,
      sessionToken,
      sessionCookieOptions(ABSOLUTE_SESSION_TTL_MS),
    );
    return {accessToken};
  }
}
