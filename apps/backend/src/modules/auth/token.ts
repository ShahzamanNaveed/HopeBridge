import crypto from 'node:crypto';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function csrfForToken(token: string): string {
  return crypto
    .createHmac('sha256', token)
    .update('hopebridge:csrf:v1')
    .digest('hex');
}
