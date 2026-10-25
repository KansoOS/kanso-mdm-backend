import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {HelperId} from '../auth/helper-id.decorator';
import {SessionAuthGuard} from '../auth/session-auth.guard';
import {CreateDeviceDto} from './dto/create-device.dto';
import {CreateSpaceDto} from './dto/create-space.dto';
import {UpdateDeviceDto} from './dto/update-device.dto';
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

  @Post(':spaceId/devices')
  @HttpCode(HttpStatus.CREATED)
  async createDevice(
    @HelperId() helperId: string,
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateDeviceDto,
  ) {
    const device = await this.spacesService.createDeviceForHelper(
      helperId,
      spaceId,
      dto.pseudonym,
    );
    if (!device) {
      throw new NotFoundException('Space not found.');
    }
    return device;
  }

  @Get(':spaceId')
  async findOne(
    @HelperId() helperId: string,
    @Param('spaceId') spaceId: string,
  ) {
    const space = await this.spacesService.findForHelper(helperId, spaceId);
    if (!space) {
      throw new NotFoundException('Space not found.');
    }
    return space;
  }

  @Get(':spaceId/devices')
  async findDevices(
    @HelperId() helperId: string,
    @Param('spaceId') spaceId: string,
  ) {
    const devices = await this.spacesService.findDevicesForHelper(
      helperId,
      spaceId,
    );
    if (!devices) {
      throw new NotFoundException('Space not found.');
    }
    return devices;
  }

  @Patch(':spaceId/devices/:deviceId')
  async updateDevice(
    @HelperId() helperId: string,
    @Param('spaceId') spaceId: string,
    @Param('deviceId') deviceId: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    const device = await this.spacesService.updateDeviceForHelper(
      helperId,
      spaceId,
      deviceId,
      dto.pseudonym,
    );
    if (!device) {
      throw new NotFoundException('Device not found.');
    }
    return device;
  }
}
