import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store as db } from './session';

const SESS_COOKIE = 'ws_session';

function readCookie(req: VercelRequest, name: string) {
  const cookie = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split('=')[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sid = readCookie(req, SESS_COOKIE);
  if (sid) db.sessions.delete(sid);
  res.setHeader('Set-Cookie', `${SESS_COOKIE}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`);
  res.json({ ok: true });
}
