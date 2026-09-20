import {randomBytes} from 'node:crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {Prisma} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';
import {LoginDto} from './dto/login.dto';
import {MfaLoginDto} from './dto/mfa-login.dto';
import {MfaRecoveryDto} from './dto/mfa-recovery.dto';
import {SignupDto} from './dto/signup.dto';
import {TokenPayload, TokenPurpose} from './token-purpose';
import {TotpService} from './totp.service';
import {Logger} from 'tslog';

const logger = new Logger();
const PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';
const MFA_TOKEN_TTL_SECONDS = 5 * 60;

@Injectable()
export class AuthService {
  // Verified against when the email is unknown, so response time doesn't
  // reveal which emails have an account.
  private readonly dummyHash = argon2.hash(randomBytes(16).toString('hex'), {
    type: argon2.argon2id,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly totpService: TotpService,
  ) {}

  async login(dto: LoginDto) {
    const helper = await this.prisma.helper.findUnique({
      where: {email: dto.email},
    });

    const passwordHash = helper?.passwordHash ?? (await this.dummyHash);
    const isPasswordValid = await argon2.verify(passwordHash, dto.password);

    if (!helper || !isPasswordValid) {
      logger.warn('Failed login attempt: invalid credentials');
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (helper.totpEnabled) {
      const mfaToken = await this.jwtService.signAsync(
        {sub: helper.id, purpose: TokenPurpose.MFA},
        {expiresIn: MFA_TOKEN_TTL_SECONDS},
      );
      logger.info('MFA challenge issued for helper: ' + helper.id);
      return {mfaRequired: true as const, mfaToken};
    }

    return this.issueAccessToken(helper.id);
  }

  async loginWithTotp(dto: MfaLoginDto) {
    const helperId = await this.verifyMfaToken(dto.mfaToken);
    await this.totpService.verifyLoginCode(helperId, dto.code);
    return this.issueAccessToken(helperId);
  }

  async loginWithRecoveryCode(dto: MfaRecoveryDto) {
    const helperId = await this.verifyMfaToken(dto.mfaToken);
    await this.totpService.verifyRecoveryCode(helperId, dto.recoveryCode);
    return this.issueAccessToken(helperId);
  }

  private async issueAccessToken(helperId: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: helperId,
      purpose: TokenPurpose.ACCESS,
    });
    logger.info('Helper logged in: ' + helperId);
    return {accessToken};
  }

  private async verifyMfaToken(mfaToken: string): Promise<string> {
    const payload = await this.jwtService
      .verifyAsync<TokenPayload>(mfaToken, {algorithms: ['HS256']})
      .catch(() => null);
    if (payload?.purpose !== TokenPurpose.MFA) {
      throw new UnauthorizedException('Invalid or expired MFA token.');
    }
    return payload.sub;
  }

  async signup(dto: SignupDto) {
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      const helper = await this.prisma.helper.create({
        data: {
          email: dto.email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });
      logger.info('Creating a new helper with email: ' + dto.email);
      return helper;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE
      ) {
        logger.error(
          'Conflict error while creating a new helper with email: ' + dto.email,
        );
        throw new ConflictException(
          'An account already exists with this email.',
        );
      }

      throw error;
    }
  }
}
