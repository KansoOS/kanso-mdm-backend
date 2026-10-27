import {ConflictException, Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {randomInt} from 'node:crypto';
import {SecretCipherService} from '../auth/secret-cipher.service';
import {PrismaService} from '../prisma/prisma.service';
import {CreateSpaceDto} from './dto/create-space.dto';

const PAIRING_CODE_TTL_MS = 15 * 60 * 1000;
const SPACE_SELECT = {id: true, pseudonym: true, createdAt: true} as const;
const DEVICE_SELECT = {
  id: true,
  pseudonym: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class SpacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secretCipher: SecretCipherService,
  ) {}

  async create(helperId: string, dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: {
        pseudonym: dto.pseudonym,
        memberships: {create: {helperId}},
      },
      select: SPACE_SELECT,
    });
  }

  async findForHelper(helperId: string, spaceId: string) {
    return this.prisma.space.findFirst({
      where: {id: spaceId, memberships: {some: {helperId}}},
      select: SPACE_SELECT,
    });
  }

  async findDevicesForHelper(helperId: string, spaceId: string) {
    const space = await this.prisma.space.findFirst({
      where: {id: spaceId, memberships: {some: {helperId}}},
      select: {id: true},
    });

    if (!space) {
      return null;
    }

    return this.prisma.device.findMany({
      where: {spaceId},
      orderBy: {createdAt: 'asc'},
      select: DEVICE_SELECT,
    });
  }

  async createDeviceForHelper(
    helperId: string,
    spaceId: string,
    pseudonym: string,
  ) {
    const space = await this.prisma.space.findFirst({
      where: {id: spaceId, memberships: {some: {helperId}}},
      select: {id: true},
    });

    if (!space) {
      return null;
    }

    try {
      return await this.prisma.device.create({
        data: {
          spaceId: space.id,
          pseudonym,
        },
        select: DEVICE_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A device with this pseudonym already exists in this space.',
        );
      }
      throw error;
    }
  }

  async updateDeviceForHelper(
    helperId: string,
    spaceId: string,
    deviceId: string,
    pseudonym: string,
  ) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        spaceId,
        space: {memberships: {some: {helperId}}},
      },
      select: {id: true},
    });

    if (!device) {
      return null;
    }

    try {
      return await this.prisma.device.update({
        where: {id: device.id},
        data: {pseudonym},
        select: DEVICE_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A device with this pseudonym already exists in this space.',
        );
      }
      throw error;
    }
  }

  async revokeDeviceForHelper(
    helperId: string,
    spaceId: string,
    deviceId: string,
  ) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        spaceId,
        space: {memberships: {some: {helperId}}},
      },
      select: {id: true},
    });

    if (!device) {
      return null;
    }

    return this.prisma.device.update({
      where: {id: device.id},
      data: {status: 'REVOKED'},
      select: DEVICE_SELECT,
    });
  }

  async createPairingCodeForHelper(
    helperId: string,
    spaceId: string,
    deviceId: string,
  ) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        spaceId,
        status: 'PENDING',
        space: {memberships: {some: {helperId}}},
      },
      select: {id: true},
    });

    if (!device) {
      return null;
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS);

    const pairingCode = await this.prisma.$transaction(async tx => {
      await tx.devicePairingCode.deleteMany({
        where: {deviceId, usedAt: null},
      });
      return tx.devicePairingCode.create({
        data: {
          deviceId,
          codeHash: this.secretCipher.hashPairingCode(code),
          expiresAt,
        },
        select: {expiresAt: true},
      });
    });

    return {code, expiresAt: pairingCode.expiresAt};
  }
}
