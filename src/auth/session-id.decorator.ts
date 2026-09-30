import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import type {AuthenticatedRequest} from './authenticated-request';

export const SessionId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>()
      .sessionId as string,
);
