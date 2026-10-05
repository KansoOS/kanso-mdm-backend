import { BadRequestException, Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { PoliciesService } from './policies.service';

@Controller('spaces/:spaceId/policy')
@UseGuards(AdminApiKeyGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  async get(@Param('spaceId') spaceId: string) {
    return this.policiesService.getCurrentPolicyOrThrow(spaceId);
  }

  @Put()
  async update(
    @Param('spaceId') spaceId: string,
    @Body() body: { content?: Prisma.InputJsonValue },
  ) {
    if (body.content === undefined) {
      throw new BadRequestException('content is required');
    }

    return this.policiesService.create(spaceId, body.content);
  }
}
