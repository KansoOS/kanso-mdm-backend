import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DevicesService } from '../devices/devices.service';
import { PrismaService } from '../prisma/prisma.service';
import { NtfyService } from '../push/ntfy.service';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
    private readonly ntfyService: NtfyService,
  ) {}

  async create(spaceId: string, content: Prisma.InputJsonValue) {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      throw new BadRequestException('Policy content must be a JSON object');
    }

    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const policy = await this.createNextVersion(spaceId, content);
        const devices = await this.prisma.device.findMany({
          where: {
            spaceId,
            revokedAt: null,
          },
          select: {
            pushTopic: true,
          },
        });

        await Promise.allSettled(
          devices.map((device) => this.ntfyService.wake(device.pushTopic)),
        );

        return policy;
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

    throw new BadRequestException('Unable to create policy version');
  }

  async getCurrentPolicy(spaceId: string) {
    return this.prisma.policy.findFirst({
      where: { spaceId },
      orderBy: { version: 'desc' },
    });
  }

  async getCurrentPolicyOrThrow(spaceId: string) {
    const policy = await this.getCurrentPolicy(spaceId);

    if (!policy) {
      throw new NotFoundException('No policy available');
    }

    return policy;
  }

  async markDeviceSynced(deviceId: string) {
    await this.devicesService.markSynced(deviceId);
  }

  private async createNextVersion(
    spaceId: string,
    content: Prisma.InputJsonValue,
  ) {
    const lastPolicy = await this.prisma.policy.findFirst({
      where: { spaceId },
      orderBy: { version: 'desc' },
    });

    return this.prisma.policy.create({
      data: {
        spaceId,
        version: (lastPolicy?.version ?? 0) + 1,
        content,
      },
    });
  }
}
