import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto';
import {Injectable} from '@nestjs/common';

const KEY_BYTES = 32;
const IV_BYTES = 12;
const FORMAT_VERSION = 'v1';

const deriveKey = (masterKey: Buffer, purpose: string): Buffer =>
  Buffer.from(
    hkdfSync('sha256', masterKey, Buffer.alloc(0), purpose, KEY_BYTES),
  );

@Injectable()
export class SecretCipherService {
  private readonly encryptionKey: Buffer;
  private readonly hmacKey: Buffer;

  constructor() {
    const masterKey = Buffer.from(
      process.env.TOTP_ENCRYPTION_KEY ?? '',
      'base64',
    );
    if (masterKey.length !== KEY_BYTES) {
      throw new Error(
        'TOTP_ENCRYPTION_KEY must be 32 bytes encoded in base64 (openssl rand -base64 32).',
      );
    }
    this.encryptionKey = deriveKey(masterKey, 'totp-secret-encryption');
    this.hmacKey = deriveKey(masterKey, 'recovery-code-hmac');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    return [
      FORMAT_VERSION,
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  decrypt(payload: string): string {
    const [version, iv, authTag, ciphertext] = payload.split(':');
    if (version !== FORMAT_VERSION || !iv || !authTag || !ciphertext) {
      throw new Error('Unsupported encrypted secret format.');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  // Keyed, so a leaked database alone doesn't allow brute-forcing the codes.
  hashRecoveryCode(normalizedCode: string): string {
    return createHmac('sha256', this.hmacKey)
      .update(normalizedCode)
      .digest('hex');
  }
}
