import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export type AuthOtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashAuthSecret(
  secret: string,
  userId: string,
  purpose: AuthOtpPurpose,
  pepper: string,
): string {
  return createHmac('sha256', pepper)
    .update(`${userId}:${purpose}:${secret}`)
    .digest('hex');
}

export function matchesAuthSecret(actualHash: string, expectedHash: string) {
  const actual = Buffer.from(actualHash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}
