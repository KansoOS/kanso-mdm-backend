import type {CookieOptions} from 'express';

export const SESSION_COOKIE_NAME = 'kanso_session';

// Secure requires HTTPS in production; browsers treat http://localhost as a
// secure context too, so this also works for local dev over plain HTTP.
export const sessionCookieOptions = (maxAgeMs?: number): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  ...(maxAgeMs !== undefined ? {maxAge: maxAgeMs} : {}),
});
