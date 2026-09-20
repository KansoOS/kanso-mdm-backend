import {randomBytes} from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as OTPAuth from 'otpauth';
import {Logger} from 'tslog';
import {PrismaService} from '../prisma/prisma.service';
import {SecretCipherService} from './secret-cipher.service';

const logger = new Logger();

const ISSUER = 'Kanso';
const TOTP_PERIOD_SECONDS = 30;
// Accept the previous and next step to tolerate clock drift.
const TOTP_WINDOW = 1;
const RECOVERY_CODE_COUNT = 10;
const MAX_MFA_ATTEMPTS = 5;
const MFA_LOCK_MS = 15 * 60 * 1000;

const normalizeRecoveryCode = (code: string): string =>
  code.replace(/-/g, '').toLowerCase();

@Injectable()
export class TotpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: SecretCipherService,
  ) {}

  async setup(helperId: string) {
    const helper = await this.findHelper(helperId);
    if (helper.totpEnabled) {
      throw new ConflictException('TOTP is already enabled.');
    }

    const secret = new OTPAuth.Secret({size: 20});
    await this.prisma.helper.update({
      where: {id: helperId},
      data: {
        totpSecretEncrypted: this.cipher.encrypt(secret.base32),
        totpLastUsedStep: null,
      },
    });

    return {
      secret: secret.base32,
      otpauthUri: this.buildTotp(secret, helper.email).toString(),
    };
  }

  async enable(helperId: string, code: string) {
    const helper = await this.findHelper(helperId);
    if (helper.totpEnabled) {
      throw new ConflictException('TOTP is already enabled.');
    }
    if (!helper.totpSecretEncrypted) {
      throw new BadRequestException('Call /auth/totp/setup first.');
    }

    const step = this.matchStep(helper.totpSecretEncrypted, code);
    if (step === null) {
      throw new UnauthorizedException('Invalid code.');
    }

    const recoveryCodes = this.generateRecoveryCodes();
    await this.prisma.$transaction(async tx => {
      // Also guards against a concurrent enable/setup on the same account.
      const {count} = await tx.helper.updateMany({
        where: {
          id: helperId,
          totpEnabled: false,
          totpSecretEncrypted: helper.totpSecretEncrypted,
        },
        data: {
          totpEnabled: true,
          totpLastUsedStep: step,
          mfaFailedAttempts: 0,
          mfaLockedUntil: null,
        },
      });
      if (count !== 1) {
        throw new ConflictException('TOTP setup changed, please retry.');
      }
      await tx.recoveryCode.deleteMany({where: {helperId}});
      await tx.recoveryCode.createMany({
        data: recoveryCodes.map(recoveryCode => ({
          helperId,
          codeHash: this.cipher.hashRecoveryCode(
            normalizeRecoveryCode(recoveryCode),
          ),
        })),
      });
    });

    logger.info('TOTP enabled for helper: ' + helperId);
    return {recoveryCodes};
  }

  async verifyLoginCode(helperId: string, code: string) {
    const helper = await this.findTotpEnabledHelper(helperId);
    await this.reserveAttempt(helperId);

    const step = this.matchStep(helper.totpSecretEncrypted, code);
    if (step === null) {
      this.rejectMfa(helperId);
    }

    // A step is accepted only once, so an intercepted code can't be replayed.
    const {count} = await this.prisma.helper.updateMany({
      where: {
        id: helperId,
        OR: [{totpLastUsedStep: null}, {totpLastUsedStep: {lt: step}}],
      },
      data: {
        totpLastUsedStep: step,
        mfaFailedAttempts: 0,
        mfaLockedUntil: null,
      },
    });
    if (count !== 1) {
      this.rejectMfa(helperId);
    }
  }

  async verifyRecoveryCode(helperId: string, recoveryCode: string) {
    await this.findTotpEnabledHelper(helperId);
    await this.reserveAttempt(helperId);

    const {count} = await this.prisma.recoveryCode.updateMany({
      where: {
        helperId,
        codeHash: this.cipher.hashRecoveryCode(
          normalizeRecoveryCode(recoveryCode),
        ),
        usedAt: null,
      },
      data: {usedAt: new Date()},
    });
    if (count !== 1) {
      this.rejectMfa(helperId);
    }

    await this.prisma.helper.update({
      where: {id: helperId},
      data: {mfaFailedAttempts: 0, mfaLockedUntil: null},
    });
    logger.warn('Recovery code used for helper: ' + helperId);
  }

  // Every attempt is counted before it is verified
  // guesses can't get more than MAX_MFA_ATTEMPTS through between two resets.
  private async reserveAttempt(helperId: string) {
    const now = new Date();
    await this.prisma.helper.updateMany({
      where: {id: helperId, mfaLockedUntil: {lte: now}},
      data: {mfaLockedUntil: null, mfaFailedAttempts: 0},
    });

    const {mfaFailedAttempts, mfaLockedUntil} = await this.prisma.helper.update(
      {
        where: {id: helperId},
        data: {mfaFailedAttempts: {increment: 1}},
        select: {mfaFailedAttempts: true, mfaLockedUntil: true},
      },
    );

    if (mfaLockedUntil === null && mfaFailedAttempts > MAX_MFA_ATTEMPTS) {
      await this.prisma.helper.updateMany({
        where: {id: helperId, mfaLockedUntil: null},
        data: {mfaLockedUntil: new Date(now.getTime() + MFA_LOCK_MS)},
      });
      logger.warn('MFA locked after too many attempts for helper: ' + helperId);
    }

    if (mfaLockedUntil !== null || mfaFailedAttempts > MAX_MFA_ATTEMPTS) {
      throw new HttpException(
        'Too many attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private rejectMfa(helperId: string): never {
    logger.warn('Failed MFA verification for helper: ' + helperId);
    throw new UnauthorizedException('Invalid code.');
  }

  private matchStep(encryptedSecret: string, code: string): number | null {
    const secret = OTPAuth.Secret.fromBase32(
      this.cipher.decrypt(encryptedSecret),
    );
    const timestamp = Date.now();
    const delta = this.buildTotp(secret).validate({
      token: code,
      timestamp,
      window: TOTP_WINDOW,
    });
    if (delta === null) {
      return null;
    }
    return (
      OTPAuth.TOTP.counter({period: TOTP_PERIOD_SECONDS, timestamp}) + delta
    );
  }

  private buildTotp(secret: OTPAuth.Secret, label = '') {
    return new OTPAuth.TOTP({
      issuer: ISSUER,
      label,
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: TOTP_PERIOD_SECONDS,
    });
  }

  private generateRecoveryCodes(): string[] {
    return Array.from({length: RECOVERY_CODE_COUNT}, () =>
      randomBytes(8)
        .toString('hex')
        .replace(/(.{4})(?=.)/g, '$1-'),
    );
  }

  private async findHelper(helperId: string) {
    const helper = await this.prisma.helper.findUnique({
      where: {id: helperId},
    });
    if (!helper) {
      throw new UnauthorizedException('Unknown account.');
    }
    return helper;
  }

  private async findTotpEnabledHelper(helperId: string) {
    const helper = await this.findHelper(helperId);
    if (!helper.totpEnabled || !helper.totpSecretEncrypted) {
      throw new UnauthorizedException('Invalid MFA session.');
    }
    return {...helper, totpSecretEncrypted: helper.totpSecretEncrypted};
  }
}
