import {ConflictException, Injectable} from '@nestjs/common';
import * as argon2 from 'argon2';
import {Prisma} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';
import {SignupDto} from './dto/signup.dto';

const PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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

      return helper;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE
      ) {
        throw new ConflictException('Un compte existe déjà avec cet email.');
      }

      throw error;
    }
  }
}
