import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateSpaceDto} from './dto/create-space.dto';

const SPACE_SELECT = {
  id: true,
  pseudonym: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(helperId: string, dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: {
        pseudonym: dto.pseudonym,
        memberships: {create: {helperId}},
      },
      select: SPACE_SELECT,
    });
  }

  async createAdmin(pseudonym: string) {
    return this.prisma.space.create({
      data: {pseudonym: pseudonym.trim()},
      select: SPACE_SELECT,
    });
  }

  async listForHelper(helperId: string) {
    return this.prisma.space.findMany({
      where: {memberships: {some: {helperId}}},
      orderBy: {createdAt: 'desc'},
      select: SPACE_SELECT,
    });
  }

  async listAdmin() {
    return this.prisma.space.findMany({
      orderBy: {createdAt: 'desc'},
      include: {
        _count: {
          select: {
            devices: true,
            policies: true,
            memberships: true,
            mandates: true,
          },
        },
      },
    });
  }

  async getAdmin(spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: {id: spaceId},
      include: {
        _count: {
          select: {
            devices: true,
            policies: true,
            memberships: true,
            mandates: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }

  async findForHelper(helperId: string, spaceId: string) {
    return this.prisma.space.findFirst({
      where: {id: spaceId, memberships: {some: {helperId}}},
      select: SPACE_SELECT,
    });
  }

  async isMember(helperId: string, spaceId: string): Promise<boolean> {
    const membership = await this.prisma.spaceMembership.findUnique({
      where: {spaceId_helperId: {spaceId, helperId}},
      select: {id: true},
    });
    return membership !== null;
  }

  async ensureMember(helperId: string, spaceId: string): Promise<void> {
    await this.prisma.spaceMembership.upsert({
      where: {spaceId_helperId: {spaceId, helperId}},
      create: {spaceId, helperId},
      update: {},
    });
  }
}
