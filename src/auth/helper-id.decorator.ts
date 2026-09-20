import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import type {AuthenticatedRequest} from './jwt-auth.guard';

// Only valid on routes protected by JwtAuthGuard, which sets helperId.
export const HelperId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>()
      .helperId as string,
);
