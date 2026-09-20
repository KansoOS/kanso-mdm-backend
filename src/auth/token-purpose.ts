// Tokens are signed with the same secret, so a claim keeps a short-lived
// "password verified, TOTP pending" token from being used as an access token.
export const TokenPurpose = {
  ACCESS: 'access',
  MFA: 'mfa',
} as const;

export interface TokenPayload {
  sub: string;
  purpose?: string;
}
