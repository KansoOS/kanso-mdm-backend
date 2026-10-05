import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { DeviceAuthGuard } from '../devices/device-auth.guard';
import type { DeviceRequest } from '../devices/device-auth.guard';
import { EventsService, IncomingDeviceEvent } from './events.service';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('devices/me/events')
  @UseGuards(DeviceAuthGuard)
  async pushEvents(
    @Req() request: DeviceRequest,
    @Body() body: { events?: IncomingDeviceEvent[] },
  ) {
    return this.eventsService.ingest(request.device.id, body.events ?? []);
  }

  @Get('spaces/:spaceId/events')
  @UseGuards(AdminApiKeyGuard)
  async listEvents(
    @Param('spaceId') spaceId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const parsedLimit = limit === undefined ? undefined : Number(limit);

    if (parsedLimit !== undefined && !Number.isInteger(parsedLimit)) {
      throw new BadRequestException('limit must be an integer');
    }

    return this.eventsService.listBySpace(spaceId, {
      cursor,
      limit: parsedLimit,
      type,
    });
  }
}
