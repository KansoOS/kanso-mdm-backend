import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DevicesService } from './devices.service';

export type DeviceRequest = Request & {
  device: {
    id: string;
    name: string | null;
    tokenHash: string;
    pushTopic: string;
    appliedPolicyVersion: number;
    lastSyncAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    spaceId: string;
  };
};

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly devicesService: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException();
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    const device = await this.devicesService.findByToken(token);

    if (!device || device.revokedAt) {
      throw new UnauthorizedException();
    }

    (request as DeviceRequest).device = device;
    return true;
  }
}
