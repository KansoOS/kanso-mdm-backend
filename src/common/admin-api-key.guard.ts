import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_API_KEY;

    if (!expected) {
      throw new ServiceUnavailableException('ADMIN_API_KEY is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const supplied = request.header('x-admin-api-key');

    if (!supplied) {
      throw new UnauthorizedException();
    }

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);

    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
