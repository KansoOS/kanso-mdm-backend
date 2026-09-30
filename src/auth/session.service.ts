import {randomBytes} from 'node:crypto';
import {Injectable} from '@nestjs/common';
import {Logger} from 'tslog';
import {PrismaService} from '../prisma/prisma.service';
import {SecretCipherService} from './secret-cipher.service';

const logger = new Logger();

const SESSION_TOKEN_BYTES = 32;
const ABSOLUTE_TTL_MS = 12 * 60 * 60 * 1000;
export const IDLE_TTL_MS = 30 * 60 * 1000;

export interface ValidSession {
  id: string;
  helperId: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: SecretCipherService,
  ) {}

  // Called only at a successful login (initial, TOTP or recovery)
  async create(helperId: string): Promise<string> {
    const rawToken = randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
    const now = new Date();
    await this.prisma.session.create({
      data: {
        helperId,
        tokenHash: this.cipher.hashSessionToken(rawToken),
        expiresAt: new Date(now.getTime() + ABSOLUTE_TTL_MS),
        lastActivityAt: now,
      },
    });
    return rawToken;
  }

  async touch(rawToken: string): Promise<ValidSession | null> {
    const tokenHash = this.cipher.hashSessionToken(rawToken);
    const session = await this.prisma.session.findUnique({
      where: {tokenHash},
    });
    if (!session) {
      return null;
    }

    const now = new Date();
    const idleDeadline = session.lastActivityAt.getTime() + IDLE_TTL_MS;
    if (
      now.getTime() > session.expiresAt.getTime() ||
      now.getTime() > idleDeadline
    ) {
      await this.prisma.session
        .delete({where: {id: session.id}})
        .catch(() => undefined);
      return null;
    }

    await this.prisma.session.update({
      where: {id: session.id},
      data: {lastActivityAt: now},
    });
    return {id: session.id, helperId: session.helperId};
  }

  async destroy(sessionId: string): Promise<void> {
    await this.prisma.session
      .delete({where: {id: sessionId}})
      .catch(() => undefined);
    logger.info('Session destroyed: ' + sessionId);
  }
}
