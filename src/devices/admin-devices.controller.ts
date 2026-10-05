import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { DevicesService } from './devices.service';

@Controller()
@UseGuards(AdminApiKeyGuard)
export class AdminDevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('spaces/:spaceId/devices/pairing-code')
  async createPairingCode(@Param('spaceId') spaceId: string) {
    return this.devicesService.createPairingCode(spaceId);
  }

  @Get('spaces/:spaceId/devices')
  async list(@Param('spaceId') spaceId: string) {
    return this.devicesService.listBySpace(spaceId);
  }

  @Post('devices/:deviceId/revoke')
  async revoke(@Param('deviceId') deviceId: string) {
    return this.devicesService.revoke(deviceId);
  }
}
