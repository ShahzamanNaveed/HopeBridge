import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';

const memory = 65536;
const passes = 3;
const parallelism = 1;
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2(
      'argon2id',
      {
        message: password,
        nonce: salt,
        memory,
        passes,
        parallelism,
        tagLength: 32,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `$argon2id$v=19$m=${memory},t=${passes},p=${parallelism}$${salt.toString('base64')}$${key.toString('base64')}`;
}
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const parts = hash.split('$');
  // Accept only this reviewed bounded profile; malformed/unexpected hashes fail closed.
  if (
    parts.length !== 6 ||
    parts[1] !== 'argon2id' ||
    parts[2] !== 'v=19' ||
    parts[3] !== `m=${memory},t=${passes},p=${parallelism}`
  )
    return false;
  const salt = Buffer.from(parts[4]!, 'base64');
  const expected = Buffer.from(parts[5]!, 'base64');
  if (salt.length !== 16 || expected.length !== 32) return false;
  return timingSafeEqual(await derive(password, salt), expected);
}
export function generateTemporaryPassword(): string {
  return randomBytes(24).toString('base64url');
}
