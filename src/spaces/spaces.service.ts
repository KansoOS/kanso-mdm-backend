import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateSpaceDto} from './dto/create-space.dto';

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
}
