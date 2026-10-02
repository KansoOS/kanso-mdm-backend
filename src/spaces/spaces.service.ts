import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(displayName?: string) {
    return this.prisma.space.create({
      data: {
        displayName: displayName?.trim() || null,
      },
    });
  }

  async list() {
    return this.prisma.space.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            devices: true,
            policies: true,
          },
        },
      },
    });
  }

  async get(spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        _count: {
          select: {
            devices: true,
            policies: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }
}
