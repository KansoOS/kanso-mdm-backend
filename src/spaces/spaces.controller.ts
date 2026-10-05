import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { SpacesService } from './spaces.service';

@Controller('spaces')
@UseGuards(AdminApiKeyGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  async create(@Body() body: { displayName?: string }) {
    return this.spacesService.create(body.displayName);
  }

  @Get()
  async list() {
    return this.spacesService.list();
  }

  @Get(':id')
  async get(@Param('id') spaceId: string) {
    return this.spacesService.get(spaceId);
  }
}
