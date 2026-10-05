import {
  Controller,
  Get,
  Headers,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { DeviceAuthGuard } from '../devices/device-auth.guard';
import type { DeviceRequest } from '../devices/device-auth.guard';
import { PoliciesService } from './policies.service';

@Controller('devices')
export class DevicePoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get('me/policy')
  @UseGuards(DeviceAuthGuard)
  async getPolicy(
    @Req() request: DeviceRequest,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() response: Response,
  ) {
    const policy = await this.policiesService.getCurrentPolicyOrThrow(
      request.device.spaceId,
    );
    const etag = `"policy-${policy.version}"`;

    await this.policiesService.markDeviceSynced(request.device.id);

    if (ifNoneMatch === etag) {
      return response.status(304).end();
    }

    response.setHeader('ETag', etag);
    response.setHeader('Cache-Control', 'private, no-cache');
    response.setHeader('X-Policy-Version', policy.version.toString());

    return response.status(200).json({
      version: policy.version,
      content: policy.content,
      createdAt: policy.createdAt,
    });
  }
}
