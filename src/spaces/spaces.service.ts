import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateSpaceDto} from './dto/create-space.dto';

const SPACE_SELECT = {id: true, pseudonym: true, createdAt: true} as const;

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
