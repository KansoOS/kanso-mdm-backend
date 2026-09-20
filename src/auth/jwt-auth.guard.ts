import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import type {Request} from 'express';
import {TokenPayload, TokenPurpose} from './token-purpose';

export type AuthenticatedRequest = Request & {helperId?: string};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const payload = await this.jwtService
      .verifyAsync<TokenPayload>(token, {algorithms: ['HS256']})
      .catch(() => null);
    if (payload?.purpose !== TokenPurpose.ACCESS) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    request.helperId = payload.sub;
    return true;
  }
}
