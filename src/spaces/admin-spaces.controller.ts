import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {AdminApiKeyGuard} from '../common/admin-api-key.guard';
import {SpacesService} from './spaces.service';

@Controller('admin/spaces')
@UseGuards(AdminApiKeyGuard)
export class AdminSpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  create(@Body() body: {pseudonym?: string; displayName?: string}) {
    const pseudonym = (body.pseudonym ?? body.displayName ?? '').trim();

    if (!pseudonym) {
      throw new BadRequestException('pseudonym is required');
    }

    return this.spacesService.createAdmin(pseudonym);
  }

  @Get()
  list() {
    return this.spacesService.listAdmin();
  }

  @Get(':id')
  get(@Param('id') spaceId: string) {
    return this.spacesService.getAdmin(spaceId);
  }
}
