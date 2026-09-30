import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {AuthenticatedRequest} from './authenticated-request';
import {SESSION_COOKIE_NAME} from './session-cookie';
import {SessionService} from './session.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawToken = (request.cookies as Record<string, string> | undefined)?.[
      SESSION_COOKIE_NAME
    ];
    if (!rawToken) {
      throw new UnauthorizedException('Missing session cookie.');
    }

    const session = await this.sessionService.touch(rawToken);
    if (!session) {
      throw new UnauthorizedException('Session expired or invalid.');
    }

    request.helperId = session.helperId;
    request.sessionId = session.id;
    return true;
  }
}
