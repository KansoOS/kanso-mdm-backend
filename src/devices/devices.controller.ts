import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../devices/device-auth.guard';
import type { DeviceRequest } from '../devices/device-auth.guard';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('enroll')
  async enroll(@Body() body: { pairingCode?: string; name?: string }) {
    return this.devicesService.enroll(body.pairingCode ?? '', body.name);
  }

  @Post('me/token/rotate')
  @UseGuards(DeviceAuthGuard)
  async rotateToken(@Req() request: DeviceRequest) {
    return this.devicesService.rotateToken(request.device.id);
  }
}
