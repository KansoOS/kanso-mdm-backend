import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createPairingCode(spaceId: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomInt(100000, 1000000).toString();

      try {
        await this.prisma.pairingCode.create({
          data: {
            codeHash: this.hashToken(code),
            expiresAt,
            spaceId,
          },
        });

        return {
          pairingCode: code,
          expiresAt,
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('Unable to generate pairing code');
  }

  async enroll(pairingCode: string, name?: string) {
    if (!/^\d{6}$/.test(pairingCode)) {
      throw new BadRequestException('Invalid pairing code');
    }

    const codeHash = this.hashToken(pairingCode);
    const code = await this.prisma.pairingCode.findUnique({
      where: { codeHash },
    });

    if (!code || code.usedAt || code.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired pairing code');
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const pushTopic = `kanso-${randomBytes(24).toString('hex')}`;

    const device = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.pairingCode.updateMany({
        where: {
          id: code.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException('Pairing code already used or expired');
      }

      return tx.device.create({
        data: {
          name: name?.trim() || null,
          tokenHash,
          pushTopic,
          spaceId: code.spaceId,
        },
      });
    });

    return {
      deviceId: device.id,
      deviceToken: token,
      spaceId: device.spaceId,
      pushTopic: device.pushTopic,
    };
  }

  async findByToken(token: string) {
    return this.prisma.device.findUnique({
      where: {
        tokenHash: this.hashToken(token),
      },
    });
  }

  async rotateToken(deviceId: string) {
    const token = randomBytes(32).toString('hex');

    await this.prisma.device.update({
      where: { id: deviceId },
      data: { tokenHash: this.hashToken(token) },
    });

    return { deviceToken: token };
  }

  async markSynced(deviceId: string) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { lastSyncAt: new Date() },
    });
  }

  async listBySpace(spaceId: string) {
    return this.prisma.device.findMany({
      where: { spaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        appliedPolicyVersion: true,
        lastSyncAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.revokedAt) {
      return {
        id: device.id,
        revokedAt: device.revokedAt,
      };
    }

    const revoked = await this.prisma.device.update({
      where: { id: deviceId },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        revokedAt: true,
      },
    });

    return revoked;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
