import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {HelperId} from '../auth/helper-id.decorator';
import {SessionAuthGuard} from '../auth/session-auth.guard';
import {CreateSpaceDto} from './dto/create-space.dto';
import {SpacesService} from './spaces.service';

@Controller('spaces')
@UseGuards(SessionAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@HelperId() helperId: string, @Body() dto: CreateSpaceDto) {
    return this.spacesService.create(helperId, dto);
  }

  @Get(':id')
  async findOne(@HelperId() helperId: string, @Param('id') id: string) {
    const space = await this.spacesService.findForHelper(helperId, id);
    if (!space) {
      throw new NotFoundException('Space not found.');
    }
    return space;
  }
}
