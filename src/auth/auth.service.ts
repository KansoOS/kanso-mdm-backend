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
import {SignupDto} from './dto/signup.dto';
import {Logger} from 'tslog';

const logger = new Logger();
const PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';

@Injectable()
export class AuthService {
  // Verified against when the email is unknown, so response time doesn't
  // reveal which emails have an account.
  private readonly dummyHash = argon2.hash(randomBytes(16).toString('hex'), {
    type: argon2.argon2id,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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

    const accessToken = await this.jwtService.signAsync({sub: helper.id});
    logger.info('Helper logged in: ' + helper.id);
    return {accessToken};
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
        logger.error('Conflict error while creating a new helper with email: ' + dto.email);
        throw new ConflictException('An account already exists with this email.');
      }

      throw error;
    }
  }
}
