import {BadRequestException, Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {SpacesService} from './spaces.service';
import {CreateMandateDto} from './dto/create-mandate.dto';

const MANDATE_SELECT = {
  id: true,
  spaceId: true,
  helperId: true,
  scope: true,
  startDate: true,
  endDate: true,
  revokedAt: true,
  revokedById: true,
  createdAt: true,
} as const;

@Injectable()
export class MandatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spacesService: SpacesService,
  ) {}

  async create(spaceId: string, dto: CreateMandateDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate.');
    }

    await this.spacesService.ensureMember(dto.helperId, spaceId);

    return this.prisma.mandate.create({
      data: {
        spaceId,
        helperId: dto.helperId,
        scope: dto.scope,
        startDate,
        endDate,
      },
      select: MANDATE_SELECT,
    });
  }

  async findInEffect(spaceId: string, helperId: string) {
    const now = new Date();
    return this.prisma.mandate.findFirst({
      where: {
        spaceId,
        helperId,
        revokedAt: null,
        startDate: {lte: now},
        endDate: {gte: now},
      },
      orderBy: {startDate: 'desc'},
      select: MANDATE_SELECT,
    });
  }
}
