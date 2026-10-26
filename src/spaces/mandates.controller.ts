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
import {CreateMandateDto} from './dto/create-mandate.dto';
import {MandatesService} from './mandates.service';
import {SpacesService} from './spaces.service';

@Controller('spaces/:spaceId/mandate')
@UseGuards(SessionAuthGuard)
export class MandatesController {
  constructor(
    private readonly mandatesService: MandatesService,
    private readonly spacesService: SpacesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @HelperId() callerHelperId: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateMandateDto,
  ) {
    if (!(await this.spacesService.isMember(callerHelperId, spaceId))) {
      throw new NotFoundException('Space not found.');
    }
    return this.mandatesService.create(spaceId, dto);
  }

  @Get()
  async findInEffect(
    @HelperId() callerHelperId: string,
    @Param('spaceId') spaceId: string,
  ) {
    const mandate = await this.mandatesService.findInEffect(
      spaceId,
      callerHelperId,
    );
    if (!mandate) {
      throw new NotFoundException('No mandate in effect.');
    }
    return mandate;
  }
}
