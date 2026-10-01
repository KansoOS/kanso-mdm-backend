import type {Request} from 'express';

// Shared between JwtAuthGuard and SessionAuthGuard: either one may populate
// helperId, only SessionAuthGuard populates sessionId.
export type AuthenticatedRequest = Request & {
  helperId?: string;
  sessionId?: string;
};
