import type { Request, Response } from 'express';
export const sessionCookieName = 'hb_session';
export function sessionToken(req: Request): string | undefined {
  const values = (req.headers.cookie ?? '')
    .split(';')
    .map((v) => v.trim())
    .filter((v) => v.startsWith(`${sessionCookieName}=`));
  return values.length === 1
    ? values[0]!.slice(sessionCookieName.length + 1)
    : undefined;
}
export function setSessionCookie(
  res: Response,
  token: string,
  secure: boolean,
) {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api/v1',
    maxAge: 24 * 3600000,
  });
}
export function clearSessionCookie(res: Response, secure: boolean) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api/v1',
  });
}
